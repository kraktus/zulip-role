import * as zulipInit from 'zulip-js';
import {
  Zulip,
  ZulipMsg,
  messageLoop,
  reply,
  send,
  react,
  ZulipDestPrivate,
  botName,
  printDest,
  getUserIdByName,
  ZulipUserName
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
    const user = getUserByName(name)
    const roles = roles_to_add.map(r => getRole(r.id))
  }

   const getUserByName = async (name: string): Promise<User> => {
    const id = await getUserIdByName(z, name);
    const user = await store.get(makePartialUser(id));
    return user
  };

   const getRole = async (name: string): Promise<Role> => {
    const role = await store.get(makePartialRole(name));
    return role
  };
  const test = async (msg: ZulipMsg) => {}

  await messageLoop(z, test);

  const commands = {'add_role':  addRole, 
                    'list_roles': noParse,
                    } as const;
})();
