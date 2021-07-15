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
  getUserIdByName
} from './zulip';
import { RedisStore, Store } from './store';
import { markdownTable } from './util';
import { Role, User, makeRole, makeUser } from './user';

(async () => {
  const z: Zulip = await zulipInit.default({ zuliprc: 'zuliprc-admin.txt' });
  const store: Store = new RedisStore();

  // const messageHandler = async (msg: ZulipMsg) => {
  //   console.log(`Command: ${msg.command}`);
  //   try {
  //     const command = await parseCommand(msg.command);
  //     switch (command) {
  //       case 'list':
  //         await listReminders(msg);
  //         break;
  //       case 'remind':
  //         await addReminder(msg, command);
  //         break;
  //       case 'delete':
  //         await deleteReminder(msg, command.id);
  //         break;
  //       case 'help':
  //         await help(msg);
  //         break;
  //     }
  //   } catch (err) {
  //     console.log(err);
  //     await react(z, msg, 'cross_mark');
  //     /* await reply(z, msg, 'Sorry, I could not parse that. Try the help command, maybe?'); */
  //   }
  // };

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

   const getFullUser = async (name: string) => {
    const id = await getUserIdByName(z, name);
    const partialUser = makeUser(id); // partial, without associated roles
    const fullUser = await store.get(partialUser);
    return fullUser
  };
  const test = async (msg: ZulipMsg) => {}

  await messageLoop(z, test);
})();
