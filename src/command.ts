import { ZulipDest, ZulipOrig, ZulipUserName } from './zulip';
import { RedisStore, Store } from './store';
import { PartialRole, User, makePartialRole, makeUser } from './user';

type ValueOf<T> = T[keyof T];

export const parseCommand = async (msg: string): Promise<ParsedInput | undefined> => {
  const verb = msg.split(' ')[0];
  const checkedVerb: Verb | undefined = verbs[verb]
    if (checkedVerb) {
        return {
          verb: checkedVerb,
          args: verbs[checkedVerb]
        }
    }
  else return undefined;
};

const parseAddRole = (msg: string): [ZulipUserName, PartialRole[]] => {
  const roles: PartialRole[] = msg.split(' ').slice(1, -1).map(id => makePartialRole(id));
  const userName: ZulipUserName = msg.split(' ')[-1]
  return [userName, roles]
}

const noParse = (msg: string) => undefined

const verbs = {'add_role':  parseAddRole, 
               'list_roles': noParse,
                    } as const;

type Verb = keyof typeof verbs;
type Args = ValueOf<typeof verbs>;
interface ParsedInput {
  verb: Verb
  args: Args
}