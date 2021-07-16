import { ZulipUserId, StreamId } from './zulip';
import { StoreItem } from './store';

export type RoleId = string;

export interface PartialUser extends StoreItem {
  type: 'user'
  id : string // string version of ZulipUserId
}

export interface User extends PartialUser {
  roles: Set<RoleId>
}

export interface PartialRole extends StoreItem {
  type: 'role'
  id: RoleId
}

export interface Role extends PartialRole {
  streams: Set<StreamId>
}

export function makePartialUser(zulip_id: ZulipUserId): PartialUser {
  return {
    type: 'user',
    id: zulip_id.toString(),
  }
}

export function makeUser(zulip_id: ZulipUserId | string, roles: Set<RoleId>): User {
  return {
    type: 'user',
    id: zulip_id.toString(),
    roles: roles
  }
}

const toRoleId = (name: string): RoleId => name.toUpperCase()

export function makePartialRole(name: string): PartialRole {
  return {
    type: 'role',
    id: toRoleId(name),
  }
}

export function makeRole(name: string, streams: Set<StreamId>): Role {
  return {
    type: 'role',
    id: toRoleId(name),
    streams: streams
  }
}