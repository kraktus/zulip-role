import { createNodeRedisClient } from 'handy-redis';
import { ZulipUserId, StreamId, ZulipId } from './zulip';

type RedisId = string | ZulipUserId;

interface AbstractItem {
  type: 'user' | 'role'
  store_id: ZulipId[]
  id: RedisId
}

export interface User extends AbstractItem {
  type: 'user'
  zulip_id(): ZulipUserId
  roles(): Role[]
}

export interface Role extends AbstractItem {
  type: 'role'
  name(): string
  streams(): StreamId[]
}

export interface Store {
  add: (a: AbstractItem) => Promise<boolean>;
  list: (a: AbstractItem) => Promise<AbstractItem[]>;
  update: (a: AbstractItem) => Promise<boolean>;
  delete: (a: AbstractItem) => Promise<boolean>;
}

// Just one possible implementation.
export class RedisStore implements Store {
  private client = createNodeRedisClient({
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB,
  })
  private prefix = 'zulip-role'
  private hashKey = (a: AbstractItem) => {return `${this.prefix}-hash-${a.type}`}

  add = async (a: AbstractItem) => {
    // do not allow updates
    const res = await this.client.hsetnx(this.hashKey(a), a.id.toString(), JSON.stringify(a)); // use stringify to allow for changes in `AbstractItem`
    return res === 1;
  }

  update = async (a: AbstractItem) => {
    if (!await this.client.hexists(this.hashKey(a), a.id.toString())) {
      console.error("Trying to update an non-existing value")
      return false
    }
    // do not allow for updates
    const res = await this.client.hset(this.hashKey(a), [a.id.toString(), JSON.stringify(a)]); // use stringify to allow for changes in `AbstractItem`
    return res === 1;
  };

  list = async (a: AbstractItem) => {
    const entries = await this.client.hvals(this.hashKey(a));
    return entries.map(this.read);
  };

  delete = async (a: AbstractItem) => {
    const res = await this.client.hdel(this.hashKey(a), a.id.toString());
    return res === 1;
  };

  private read = (entry: string): AbstractItem => {
    const r = JSON.parse(entry);
    return r;
  };
}
