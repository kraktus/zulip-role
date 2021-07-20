import { promisify } from 'util';
import { SetM } from './util';

export interface Zulip {
  queues: any;
  events: any;
  users: any;
  messages: any;
  reactions: any;
  streams: any;
  callEndpoint: (path: string, method: 'GET' | 'POST', params: any) => Promise<any>;
}

export type ZulipUserName = string;
export type ZulipUserId = number;
export type StreamId = number;
export type StreamName = string;

export interface Stream {
  name: StreamName;
  stream_id: StreamId;
  subscribers?: ZulipUserId[];
}

export interface ZulipUser {
  user_id: ZulipUserId;
  full_name: string;
}

export interface userResponse {
  members: ZulipUser[];
}

export interface ZulipOrigStream {
  type: 'stream';
  sender_id: ZulipUserId;
  stream_id: StreamId;
  subject: string;
}

export interface ZulipOrigPrivate {
  type: 'private';
  sender_id: ZulipUserId;
  recipient_id: ZulipUserId;
}

export type ZulipOrig = ZulipOrigStream | ZulipOrigPrivate;

export interface ZulipMsgStream extends ZulipOrigStream {
  id: number;
  content: string;
  command: string;
}
export interface ZulipMsgPrivate extends ZulipOrigPrivate {
  id: number;
  content: string;
  command: string;
}

export type ZulipMsg = ZulipMsgStream | ZulipMsgPrivate;

export interface ZulipDestStream {
  type: 'stream';
  to: number | string;
  topic: string;
}

export interface ZulipDestPrivate {
  type: 'private';
  to: [ZulipUserId];
}

export type ZulipDest = ZulipDestStream | ZulipDestPrivate;

export const messageLoop = async (zulip: Zulip, handler: (msg: ZulipMsg) => Promise<void>) => {
  const q = await zulip.queues.register({ event_types: ['message'] });
  const me = await zulip.users.me.getProfile();
  let lastEventId = q.last_event_id;
  console.log(`Connected to zulip as @${me.full_name}, awaiting commands`);
  const streams = await zulip.streams.retrieve({ include_all_active: true });
  console.log(`Streams: ${streams.streams.map(r => r.name)}`);
  await send(zulip, { type: 'stream', to: 'zulip', topic: 'bots log' }, 'I started.');
  while (true) {
    try {
      const res = await zulip.events.retrieve({
        queue_id: q.queue_id,
        last_event_id: lastEventId,
      });
      res.events.forEach(async (event: any) => {
        lastEventId = event.id;
        if (event.type == 'heartbeat') {
          //console.log('Zulip heartbeat');
        } else if (event.message) {
          // ignore own messages and only handle those which starts with a ping to the bot
          event.message.content = event.message.content.trim()
          if (event.message.sender_id != me.user_id && event.message.content.startsWith(`@**${me.full_name}**`)) {
            event.message.command = event.message.content.replace(`@**${me.full_name}**`, '').trim();
            await handler(event.message as ZulipMsg);
          }
        } else console.log(event);
      });
    } catch (e) {
      console.error(e);
      await promisify(setTimeout)(2000);
    }
  }
};

export const botName = async (zulip: Zulip): Promise<string> => {
  const me = await zulip.users.me.getProfile();
  return me.full_name;
};

const origToDest = (orig: ZulipOrig): ZulipDest => {
  return orig.type == 'stream'
    ? {
        type: 'stream',
        to: orig.stream_id,
        topic: orig.subject,
      }
    : {
        type: 'private',
        to: [orig.sender_id],
      };
};

export const send = async (zulip: Zulip, dest: ZulipDest, text: string) => {
  await zulip.messages.send({
    ...dest,
    content: text,
  });
};

export const invite = async (zulip: Zulip, users: ZulipUserId[], to: StreamName[]) => {
  const params = {
    subscriptions: to.map(n => ({ name: n })), // Is considered as code block without parenthesis
    principals: users,
  };
  const res = await zulip.users.me.subscriptions.add(params);
  console.log('response invitation api '+res)
};

export const getSubbedStreams = async (zulip: Zulip): Promise<SetM<Stream>> => {
  const res = await zulip.streams.subscriptions.retrieve();
  console.log(`raw streams: ${JSON.stringify(res)}`);
  return new SetM(res.subscriptions);
};

export const getStreamByName = async (zulip: Zulip, stream_names: SetM<Stream['name']>): Promise<SetM<Stream>> => {
  const all_streams = await getSubbedStreams(zulip);
  console.log(`All streams: ${JSON.stringify(all_streams)}`);
  return all_streams.filter(s => stream_names.has(s.name.toLowerCase()));
};

export const getAllStreams = async (zulip: Zulip): Promise<Stream[]> =>
  await zulip.streams.retrieve({ include_all_active: true });

export const getAllUsers = async (zulip: Zulip): Promise<ZulipUser[]> => {
  const resp: userResponse = await zulip.users.retrieve({ client_gravatar: true });
  return resp.members;
};

export const getUserIdByName = async (zulip: Zulip, full_name: string): Promise<ZulipUserId | undefined> => {
  const users = await getAllUsers(zulip);
  const user = users.find(u => u.full_name === full_name);
  return user ? user.user_id : undefined;
};

export const reply = async (zulip: Zulip, to: ZulipMsg, text: string) => await send(zulip, origToDest(to), text);

export const react = async (zulip: Zulip, to: ZulipMsg, emoji: string) =>
  await zulip.reactions.add({
    message_id: to.id,
    emoji_name: emoji,
  });

export const printDest = (dest: ZulipDest) => (dest.type == 'stream' ? `\`${dest.topic}\`` : 'you');
