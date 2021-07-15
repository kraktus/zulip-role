import { createNodeRedisClient } from 'handy-redis';
import { ZulipUserId, StreamId } from './zulip';
import { RoleId } from './user';

export interface StoreItem {
  type: 'user' | 'role'
  id: string
}

export interface Store {
  get: (a: StoreItem) => Promise<StoreItem | undefined>;
  add: (a: StoreItem) => Promise<boolean>;
  list: (a: StoreItem) => Promise<StoreItem[]>;
  update: (a: StoreItem) => Promise<boolean>;
  delete: (a: StoreItem) => Promise<boolean>;
}

// Just one possible implementation.
export class RedisStore implements Store {
  private client = createNodeRedisClient({
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB,
  })
  private prefix = 'zulip-role'
  private hashKey = (a: StoreItem) => {return `${this.prefix}-hash-${a.type}`}

  get = async (a: StoreItem) => {
    // do not allow updates
    const entry = await this.client.hget(this.hashKey(a), a.id);
    if (!entry) {
      console.error(`Trying to get an non-existing value: ${a.id}`)
      return undefined
    } else {
      return this.read(entry)
    }
  }

  add = async (a: StoreItem) => {
    // do not allow updates
    const res = await this.client.hsetnx(this.hashKey(a), a.id, JSON.stringify(a)); // use stringify to allow for changes in `StoreItem`
    return res === 1;
  }

  update = async (a: StoreItem) => {
    if (!await this.client.hexists(this.hashKey(a), a.id)) {
      console.error(`Trying to update an non-existing value: ${a.id}`)
      return false
    }
    // do not allow for updates
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

  private read = (entry: string): StoreItem => {
    const r = JSON.parse(entry);
    return r;
  };
}
