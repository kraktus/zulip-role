import { promisify } from 'util';

export interface Zulip {
  queues: any;
  events: any;
  users: any;
  messages: any;
  reactions: any;
  streams: any;
  callEndpoint: (path: string, method: 'GET' | 'POST', params: any) => Promise<any>;
}

export type ZulipUserId = number;
export type StreamId = number;
export type ZulipId = ZulipUserId | StreamId;

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

export type GetTimezone = (ZulipUserId: ZulipUserId) => Promise<string>;

export const messageLoop = async (zulip: Zulip, handler: (msg: ZulipMsg) => Promise<void>) => {
  const q = await zulip.queues.register({ event_types: ['message'] });
  const me = await zulip.users.me.getProfile();
  let lastEventId = q.last_event_id;
  console.log(`Connected to zulip as @${me.full_name}, awaiting commands`);
  const streams = await zulip.streams.retrieve({include_all_active: true})
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
          // ignore own messages
          if (event.message.sender_id != me.user_id) {
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

export const userTimezone =
  (zulip: Zulip) =>
  async (ZulipUserId: ZulipUserId): Promise<string> => {
    const res = await zulip.callEndpoint(`/users/${ZulipUserId}`, 'GET', {});
    return res.user.timezone;
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

export const reply = async (zulip: Zulip, to: ZulipMsg, text: string) => await send(zulip, origToDest(to), text);

export const react = async (zulip: Zulip, to: ZulipMsg, emoji: string) =>
  await zulip.reactions.add({
    message_id: to.id,
    emoji_name: emoji,
  });

export const printDest = (dest: ZulipDest) => (dest.type == 'stream' ? `\`${dest.topic}\`` : 'you');
