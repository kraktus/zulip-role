import * as zulipInit from 'zulip-js';
import { CommandList } from './command_list';
import {
  Zulip,
  ZulipMsg,
  messageLoop,
  reply,
  react,
  invite,
  botName,
  getUserIdByName,
  ZulipUserName,
  getSubbedStreams,
  StreamId,
  Stream,
  ZulipUserId,
  getStreamByName,
  getAllUsers,
} from './zulip';
import { RedisStore, Store } from './store';
import { markdownTable, SetM } from './util';
import { parseCommand } from './command';
import { Role, User, makeRole, makeUser, makePartialUser, makePartialRole, PartialRole } from './user';

(async () => {
  const z: Zulip = await zulipInit.default({ zuliprc: 'zuliprc-admin.txt' });
  const store: Store = new RedisStore();

  // --------------- command functions

  const addRole = async (m: ZulipMsg, name: ZulipUserName, roles_to_add: SetM<PartialRole>) => {
    const user: User | undefined = await getUserByName(name);
    const user_id = await getUserIdByName(z, name);
    console.log('roles to add ' + roles_to_add.join(' '));
    const checked_roles = await Promise.all(roles_to_add.map(r => getRole(r.id)));

    await sanitize_input(
      m,
      checked_roles,
      roles_to_add,
      'roles',
      x => (x ? x.join(' ') : ''),
      (x: SetM<PartialRole>) => x.join(' ')
    );
    // update user already in the db
    if (user) {
      user.roles = user.roles.union(roles_to_add.map(r => r.id));
      await store.update(user);
    } else if (user_id) {
      // new user
      console.log(`${name} added to the db`);
      const user_db = makeUser(
        user_id,
        roles_to_add.map(r => r.id)
      );
      console.log(JSON.stringify(user_db));
      await store.add(user_db);
    } else {
      reply(z, m, 'User not found on this zulip, check name');
    }
    if (user_id) {
      await syncUsers([user_id]); // invite them now
    }
  };

  const addStream = async (m: ZulipMsg, role_name: string, stream_names: SetM<Stream['name']>, insert = false) => {
    const role = await getRole(role_name);
    const streams: SetM<Stream> = await getStreamByName(z, stream_names);
    sanitize_input(
      m,
      streams,
      stream_names,
      'streams',
      (x: SetM<Stream>) => x.map(s => s.name).join(' '),
      (x: SetM<Stream['name']>) => x.join(' ')
    );
    console.log(`Streams fetched ${[...streams]}`);
    if (role) {
      role.streams = role.streams.union(streams.map(s => s.stream_id));
      await store.update(role);
    } else if (insert) {
      console.log(`${role_name} does not exist, creating it`);
      const role_db = makeRole(
        role_name,
        streams.map(s => s.stream_id)
      );
      await store.add(role_db);
    }

    if (role) {
      // invite users to the new channel. If the role was inserted no one got it
      const users_to_be_invited = await getUsersByRole([role]);
      await syncUsers(users_to_be_invited.map(u => Number(u.id)));
    }
  };

  const createRole = async (_: ZulipMsg, role_name: string, stream_names: SetM<Stream['name']>) =>
    addStream(_, role_name, stream_names, true);

  const list = async (msg: ZulipMsg, streams = true) => {
    // DEBUG: should be false by default
    const users: User[] = await store.list_user();
    const users_api = await getAllUsers(z);
    const roles: Role[] = await store.list_role();
    const stream_set = await getSubbedStreams(z);
    const stream_map = new Map(stream_set.map(s => [s.stream_id, s.name]));
    const user_api_map = new Map(users_api.map(u => [u.user_id, u.full_name]));
    const table = [
      ['Role', 'Users', 'Streams'],
      ...roles.map(r => [
        r.id,
        users
          .filter(u => u.roles.has(r.id))
          .map(u => user_api_map.get(Number(u.id)))
          .join(' '),
        // https://stackoverflow.com/a/37199067/11955835
        streams ? r.streams.map(stream_map.get.bind(stream_map)).join(' ') : '',
      ]),
    ];
    await reply(z, msg, markdownTable(table));
  };

  // --------------- helper functions

  const sanitize_input = async <T extends { length: number }, T2 extends { length: number }>(
    m: ZulipMsg,
    t: T,
    t_req: T2,
    type: 'roles' | 'streams' | 'user',
    f_t: (x: T) => string = String,
    f_t_req: (x: T2) => string = String
  ) => {
    if (t && t.length !== t_req.length) {
      const txt = `Some ${type} were not found, please check. Streams names requested: \`${f_t_req(t_req)}\` 
        ${type} found: \`${f_t(t)}\``;
      await reply(z, m, txt);
      throw Error;
    }
  };

  const getUserByName = async (name: string): Promise<User | undefined> => {
    const id = await getUserIdByName(z, name);
    if (!id) {
      return undefined;
    }
    const user: User | undefined = await store.get(makePartialUser(id));
    console.log(user);
    return user;
  };

  const getRole = async (name: string): Promise<Role | undefined> => {
    const role: Role | undefined = await store.get(makePartialRole(name));
    console.log(role);
    return role;
  };

  const getUsersByRole = async (roles: Role[]): Promise<User[]> => {
    const unfiltered_users: User[] = await store.list_user();
    console.log(roles);
    return roles.flatMap(r => unfiltered_users.filter(u => u.roles.has(r.id)));
  };

  const test = async (msg: ZulipMsg) => {
    const res = await getUserByName('Ext');
    console.log(JSON.stringify(res));
    try {
      await sanitize_input(msg, [1, 2, 3], [4], 'roles');
    } catch (err) {
      console.log(err);
      await react(z, msg, 'cross_mark');
    }
  };

  const syncUsers = async (only_these?: ZulipUserId[]) => {
    const unfiltered_users: User[] = await store.list_user();
    const users = only_these ? unfiltered_users.filter(u => Number(u.id) in only_these) : unfiltered_users;
    const roles: Role[] = await store.list_role();
    const streams = await getSubbedStreams(z);
    console.log(streams);
    await Promise.all(
      users.map(user => {
        // about `find`. We know user roles are a subset of all roles.
        const streams_should_be_in: SetM<StreamId> = user.roles.flatMap(
          r_id => (roles.find(r => r.id == r_id) as Role).streams
        );
        const actual_stream_names = streams.filter(s => streams_should_be_in.has(s.stream_id)).map<string>(s => s.name);
        return invite(z, [Number(user.id)], [...actual_stream_names]);
      })
    );
  };

  // ------------------------
  const commands: CommandList = {
    add_role: addRole,
    add_stream: addStream,
    create_role: createRole,
    list: list,
  } as const;

  const messageHandler = async (msg: ZulipMsg) => {
    console.log(`Message stripped bot mention: ${msg.command}`);
    try {
      const command = await parseCommand(msg.command);
      if (command) {
        // Command.args returns proper value to the corresponding function
        await commands[command.verb](msg, ...command.args);
        await react(z, msg, 'check_mark');
      }
    } catch (err) {
      console.log(err);
      await react(z, msg, 'cross_mark');
      /* await reply(z, msg, 'Sorry, I could not parse that. Try the help command, maybe?'); */
    }
  };

  await messageLoop(z, messageHandler);
})();
