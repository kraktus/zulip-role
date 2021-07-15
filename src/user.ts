import { ZulipUserId, StreamId } from './zulip';
import { StoreItem } from './store';

export type RoleId = string;

export interface User extends StoreItem {
  type: 'user'
  roles: Set<RoleId>
}

export interface Role extends StoreItem {
  type: 'role'
  id: RoleId
  streams: Set<StreamId>
}

export function makeUser(zulip_id: ZulipUserId, roles?: Set<RoleId>): User {
  return {
    type: 'user',
    id: zulip_id.toString(),
    roles: roles
  }
}

export function makeRole(id: RoleId, streams?: Set<StreamId>): Role {
  return {
    type: 'role',
    id: id,
    streams: streams
  }
}