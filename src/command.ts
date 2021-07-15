import { ZulipDest, ZulipOrig } from './zulip';
import { RedisStore, Store } from './store';
import { Role, User, makeRole, makeUser } from './user';

// https://stackoverflow.com/a/61131590/11955835
const commands = ['list_users', 'list_roles', 'list_roles_and_streams', 'add_role', 'add_stream', 'del_role', 'del_stream'] as const;

type Command = typeof commands[number];
const commands2 = {'add_role':  parseAddRole, 'list_roles': parseAddRole} as const;
type Command2= typeof commands2[keyof commands2];
type Com = keyof typeof commands2;


export const parseCommand = async (msg: string): Promise<Command | undefined> => {
  const verb = msg.split(' ')[0];
  const cmd = commands.find((validKey) => validKey === verb);
    if (cmd) {
        return cmd;
    }
  else return undefined;
};

const parseAddRole = (msg: string): [string, Role[]] => {
  const roles: Role[] = msg.split(' ').slice(1, -1).map(id => makeRole(id));
  const userName = msg.split(' ')[-1]
  return [userName, roles]
}
