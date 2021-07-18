import { ZulipUserId, StreamId } from "./zulip";
import { StoreItem } from "./store";
import { SetM } from "./util";

export type RoleId = Uppercase<string>;

export interface PartialUser extends StoreItem {
  readonly type: "user";
  id: string; // string version of ZulipUserId
}

export interface User extends PartialUser {
  roles: SetM<RoleId>;
}

export interface PartialRole extends StoreItem {
  readonly type: "role";
  id: RoleId;
}

export interface Role extends PartialRole {
  streams: SetM<StreamId>;
}

export function makePartialUser(zulip_id: ZulipUserId): PartialUser {
  return {
    type: "user",
    id: zulip_id.toString(),
  };
}

export function makeUser(
  zulip_id: ZulipUserId | string,
  roles: SetM<RoleId>
): User {
  return {
    type: "user",
    id: zulip_id.toString(),
    roles: roles,
  };
}

const toRoleId = (name: string): RoleId => name.toUpperCase();

export function makePartialRole(name: string): PartialRole {
  return {
    type: "role",
    id: toRoleId(name),
  };
}

export function makeRole(name: string, streams: SetM<StreamId>): Role {
  return {
    type: "role",
    id: toRoleId(name),
    streams: streams,
  };
}
