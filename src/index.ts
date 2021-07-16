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
  userIdFromMail
} from './zulip';
import { RedisStore, Store } from './store';
import { markdownTable } from './util';
import {parseCommand} from './command';
import { Role, User, makeRole, makeUser, makePartialUser, makePartialRole, PartialRole } from './user';

(async () => {
  const z: Zulip = await zulipInit.default({ zuliprc: 'zuliprc-admin.txt' });
  const store: Store = new RedisStore();

  const messageHandler = async (msg: ZulipMsg) => {
    console.log(`Command: ${msg.command}`);
    try {
      const command = await parseCommand(msg.command);
      if (command) {
        await commands[command.verb](command.args)
      }
    } catch (err) {
      console.log(err);
      await react(z, msg, 'cross_mark');
      /* await reply(z, msg, 'Sorry, I could not parse that. Try the help command, maybe?'); */
    }
  };

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

  const addRole = async (name: ZulipUserName, roles_to_add: PartialRole[]) => {
    const user = await getUserByName(name);
    // update user
    user.roles = new Set([...user.roles, ...roles_to_add.map(r => r.id)]);
    await store.update(user)
  }

   const getUserByName = async (name: string): Promise<User> => {
    const id = await getUserIdByName(z, name);
    const user = await store.get(makePartialUser(id));
    console.log(user)
    return user
  };

   const getRole = async (name: string): Promise<Role> => {
    const role = await store.get(makePartialRole(name));
    console.log(role)
    return role
  };
  const test = async (msg: ZulipMsg) => {
    return
    const res = await invite(z, [123], ['core team']);
    console.log(res)
  }

  const syncUsers =  async (msg: ZulipMsg) => {
    const users: User[] = await store.list(makePartialUser(0)) // id not used for that call
    const streams = await getSubbedStreams(z)
    console.log(streams)
    const streamsByUsers = streams.reduce((acc: any, stream: any) => { // dirty and inefficient, need to switch db (fearing too many calls)
      stream.subscribers.forEach(user_id_email => {
        const user_id = userIdFromMail(user_id_email);
        console.log(user_id)
        if (acc[user_id]) {
          acc[user_id].append(stream)
        } else {
          acc[user_id] = [stream]
        }
      })
      return acc
    })
    console.log(streamsByUsers)
  }


  // ------------------------
  await messageLoop(z, syncUsers);
  const commands = {'add_role':  addRole, 
                    } as const;
})();
