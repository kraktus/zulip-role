import { createNodeRedisClient } from 'handy-redis';
import { ZulipUserId, StreamId } from './zulip';
import { RoleId, Role, User, makePartialUser, makePartialRole } from './user';
import { SetM } from './util';

export interface StoreItem {
  type: 'user' | 'role';
  id: string;
}

export interface Store {
  get: (a: StoreItem) => Promise<any | undefined>; // TODO find better solution
  add: (a: StoreItem) => Promise<boolean>;
  list: (a: StoreItem) => Promise<any[]>;
  update: (a: StoreItem) => Promise<boolean>;
  delete: (a: StoreItem) => Promise<boolean>;

  list_user: () => Promise<User[]>;
  list_role: () => Promise<Role[]>;
}

// Just one possible implementation.
export class RedisStore implements Store {
  private client = createNodeRedisClient({
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB ? process.env.REDIS_DB : 1,
  });
  private prefix = 'zulip-role';
  private hashKey = (a: StoreItem) => `${this.prefix}-hash-${a.type}`;

  get = async (a: StoreItem) => {
    // do not allow updates
    const entry = await this.client.hget(this.hashKey(a), a.id);
    if (!entry) {
      console.error(`Trying to get an non-existing value: ${a.id}`);
      return undefined;
    } else {
      return this.read(entry);
    }
  };

  add = async (a: StoreItem) => {
    // do not allow updates
    console.log(a);
    console.log(JSON.stringify(a));
    const res = await this.client.hsetnx(this.hashKey(a), a.id, JSON.stringify(a)); // use stringify to allow for changes in `StoreItem`
    return res === 1;
  };

  update = async (a: StoreItem) => {
    // do not allow adding new keys
    if (!(await this.client.hexists(this.hashKey(a), a.id))) {
      console.error(`Trying to update an non-existing value: ${a.id}`);
      return false;
    }
    const res = await this.client.hset(this.hashKey(a), [a.id, JSON.stringify(a)]); // use stringify to allow for changes in `StoreItem`
    return res === 1;
  };

  list = async (a: StoreItem) => {
    const entries = await this.client.hvals(this.hashKey(a));
    return entries.map(this.read);
  };

  delete = async (a: StoreItem) => {
    const res = await this.client.hdel(this.hashKey(a), a.id);
    return res === 1;
  };

  private read = (entry: string): any => {
    console.log('entry: ' + entry);
    const r = JSON.parse(entry);
    console.log(r);
    if (r.type === 'role') {
      r.streams = new SetM(r.streams.toJSON);
    } else if (r.type === 'user') {
      r.roles = new SetM(r.roles.toJSON);
    }
    return r;
  };

  list_user = async () => {
    return this.list(makePartialUser(0));
  };

  list_role = async () => {
    return this.list(makePartialRole(''));
  };
}
