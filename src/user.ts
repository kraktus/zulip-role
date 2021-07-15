import { ZulipUserId, StreamId, ZulipId } from './zulip';
import { AbstractItem } from './store';

export type RoleId = string;

export interface User extends AbstractItem {
  type: 'user'
  id: ZulipUserId
  roles(): Set<RoleId>
}

export interface Role extends AbstractItem {
  type: 'role'
  id: RoleId
  streams(): Set<StreamId>
}

export function makeUser(zulip_id: ZulipUserId, roles: Set<RoleId> = new Set): User {
  return {
    type: 'user',
    id: zulip_id,
    store_id: roles,
    roles: () => roles
  }
}

export function makeRole(id: RoleId, streams: Set<StreamId> = new Set): Role {
  return {
    type: 'role',
    id: id,
    store_id: streams,
    streams: () => streams
  }
}