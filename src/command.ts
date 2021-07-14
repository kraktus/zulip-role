import { GetTimezone, printDest, UserId, ZulipDest, ZulipOrig } from './zulip';
import { Role, User, RedisStore, Store } from './store';

// https://stackoverflow.com/a/61131590/11955835
const commands = ['list_users', 'list_roles', 'list_roles_and_streams', 'add_role', 'add_stream', 'del_role', 'del_stream'] as const;
const commands2 = {'list_users':  'list_roles'} as const;
type Command = typeof commands[number];

export const parseCommand = async (msg: string): Promise<Command | undefined> => {
  const verb = msg.split(' ')[0];
  const cmd = commands.find((validKey) => validKey === verb);
    if (cmd) {
        return cmd;
    }
  else return undefined;
};

const parseAddRole = (msg: string): [User, Role[]] => {
  const roles: Role[] = msg.split(' ').slice(1, -1).map(name => {
    type: 'role'
    id: 
  });
}