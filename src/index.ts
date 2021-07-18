import * as zulipInit from 'zulip-js';
import {
  Zulip,
  ZulipMsg,
  messageLoop,
  reply,
  send,
  react,
  invite,
  ZulipDestPrivate,
  botName,
  printDest,
  getUserIdByName,
  ZulipUserName,
  getSubbedStreams,
  userIdFromMail,
  StreamId,
  Stream,
  ZulipUserId,
  getStreamByName
} from './zulip';
import { RedisStore, Store } from './store';
import { markdownTable, SetM } from './util';
import {parseCommand} from './command';
import { Role, User, makeRole, makeUser, makePartialUser, makePartialRole, PartialRole, PartialUser } from './user';

(async () => {
  const z: Zulip = await zulipInit.default({ zuliprc: 'zuliprc-admin.txt' });
  const store: Store = new RedisStore();

  const help = async (msg: ZulipMsg) => {
    const name = await botName(z);
    const mention = `@${name}`;
    await reply(
      z,
      msg,
      [
        'Use `' + mention + '` to set a reminder for yourself, or for a stream.',
        'Some examples include:',
        '- `' + mention + ' me on June 1st to wish Linda happy birthday`',
        '- `' + mention + ' me to stop procrastinating tomorrow`',
        '- `' + mention + ' here in 3 hours to update the project status`',
        '- `' + mention + ' stream to party hard on 2021-09-27 at 10pm`',
        '',
        'Use `' + mention + ' list` to see the list of all your reminders.',
        '',
        'Use `' + mention + ' delete id` to delete a reminder by its ID',
      ].join('\n')
    );
  };

  // --------------- command functions

  const addRole = async (_: ZulipMsg, name: ZulipUserName, roles_to_add: SetM<PartialRole>) => {
    const user: User | undefined = await getUserByName(name);
    // update user already in the db
    if (user) {
    user.roles = user.roles.union(roles_to_add.map(r => r.id));
    await store.update(user)
    } else { // new user
      console.log(`${name} added to the db`)
      const user_db = makeUser(user.id, roles_to_add.map(r => r.id))
      await store.add(user_db)
    }
    const user_id = await getUserIdByName(z, name);
    await syncUsers([user_id]) // invite them now
  }

  const addStream = async (_: ZulipMsg, role_name: string, stream_names: SetM<Stream['name']>, insert: boolean = false) => {
    const role: Role | undefined = await getRole(role_name)
    const streams: SetM<Stream> = await getStreamByName(z, stream_names)
    if (role) {
      role.streams = role.streams.union(streams.map(s => s.stream_id))
      await store.update(role)
    } else if (insert) {
      console.log(`${role_name} does not exist, creating it`)
      const role_db = makeRole(role_name, streams.map(s => s.stream_id))
      await store.add(role_db)
    }

    if (role) { // invite users to the new channel. If the role was inserted no one got it
      const users_to_be_invited = await getUsersByRole([role_name])
      await syncUsers(users_to_be_invited.map(u => Number(u.id))) 
    }
  }

  const createRole = async (_: ZulipMsg, role_name: string, stream_names: SetM<Stream['name']>) => addStream(_, role_name, stream_names, true)


 const list = async (msg: ZulipMsg, streams: boolean = true) => { // DEBUG: should be false by default
   const users: User[] = await store.list_user()
   const roles: Role[] = await store.list_role()
   const table = [['Role', 'Users', 'Streams'],
     ...roles.map(r =>
     [r.id,
     users.filter(u => u.roles.has(r.id)).map(u => u.id).join(' '),
     streams ? r.streams.map<string>(s => s.toString()).join(' ') : ''
     ])]
    await reply(z, msg, markdownTable(table))
 }


  // --------------- helper functions

   const getUserByName = async (name: string): Promise<User> => {
    const id = await getUserIdByName(z, name);
    const user = await store.get(makePartialUser(id));
    console.log(user)
    return user
  };

   const getRole = async (name: string): Promise<Role> => {
    const role: Role | undefined = await store.get(makePartialRole(name));
    console.log(role)
    return role
  };

  const getUsersByRole = async (role_names: string[]): Promise<User[]> => {
    const roles = await Promise.all(role_names.map(getRole))
    const unfiltered_users: User[] = await store.list_user()
    console.log(roles)
    return roles.flatMap(r => unfiltered_users.filter(u => u.roles.has(r.id)))
  };


  const test = async (msg: ZulipMsg) => {
    return
    const res = await invite(z, [123], ['core team']);
    console.log(res)
  }

  const syncUsers =  async (only_these?: ZulipUserId[]) => {
    const unfiltered_users: User[] = await store.list_user()
    const users = only_these ? unfiltered_users.filter(u => Number(u.id) in only_these) : unfiltered_users
    const roles: Role[] = await store.list_role()
    const streams = await getSubbedStreams(z)
    console.log(streams)
    await Promise.all(users.map(user => {
      let streams_should_be_in: SetM<StreamId> = user.roles.flatMap(r_id => roles.find(r => r.id == r_id).streams);
      const actual_stream_names = streams.filter(s => streams_should_be_in.has(s.stream_id)).map<string>(s => s.name);
      return invite(z, [Number(user.id)], [...actual_stream_names])
    }))
  }


  // ------------------------
  const commands = {'add_role':  addRole, 
                    'add_stream':  addStream, 
                    'create_role': createRole,
                    'list': list,
                    } as const;


    const messageHandler = async (msg: ZulipMsg) => {
    console.log(`Command: ${msg.command}`);
    try {
      const command = await parseCommand(msg.command);
      console.log(command)
      if (command) {
        await commands[command.verb](msg, ...command.args as any) // TODO fix that
      }
    } catch (err) {
      console.log(err);
      await react(z, msg, 'cross_mark');
      /* await reply(z, msg, 'Sorry, I could not parse that. Try the help command, maybe?'); */
    }
  };

  await messageLoop(z, messageHandler);
})();
