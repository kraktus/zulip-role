import { ZulipDest, ZulipOrig, ZulipUserName, Stream } from './zulip';
import { RedisStore, Store } from './store';
import { PartialRole, User, makePartialRole, makeUser } from './user';
import { SetM } from './util';

type ValueOf<T> = T[keyof T];

type FunctionReturnValues<T> = {
  [K in keyof T]: T[K] extends (...args: any) => any ? ReturnType<T[K]> : never
}[keyof T]

const parseAddRole = (msg: string): [ZulipUserName, SetM<PartialRole>] => {
  // first word is the command name
  const roles: SetM<PartialRole> = new SetM(msg.split(' ').slice(1, -1).map(id => makePartialRole(id)));
  const userName: ZulipUserName = msg.split(' ').slice(-1)[0]
  return [userName, roles]
}

const parseAddStream = (msg: string): [string, SetM<Stream['name']>] => {
  // stream names need to be lowercase for further process.
  // Should accept stream-name and #stream-name
  console.log(msg.split(' '))
  console.log(msg.split(' ').slice(1, -1))
  console.log(msg.split(' ').slice(-1)[0])
  const streams = new SetM(msg.split(' ').slice(1, -1).map(str => remove_first_char_if(str.toLowerCase(), '#')));
  // Should accept role_name and @role_name 
  const role_name: string = remove_first_char_if(msg.split(' ').slice(-1)[0], '@')
  return [role_name, streams]
}


const remove_first_char_if = (str: string, char: string) => str.startsWith(char) ? str.substring(char.length): str

const noParse = (msg: string): void => undefined

const verbs = {'add_role':  parseAddRole,
               'add_stream':  parseAddStream,
               'create_role':  parseAddStream,
               'list_roles': noParse,
                    } as const;

type Verb = keyof typeof verbs;
type Args = FunctionReturnValues<typeof verbs>;
interface ParsedInput {
  verb: Verb
  args: Args
}

export const parseCommand = async (msg: string): Promise<ParsedInput | undefined> => {
  const verb = msg.split(' ')[0];
  console.log(`Verb: ${verb}`)
  const parseFunction: Function = verbs[verb]
    if (parseFunction) {
      console.log(`Command recognized: ${verb}`)
        return {
          verb: verb as Verb,
          args: parseFunction(msg)
        }
    }
  else return undefined;
};