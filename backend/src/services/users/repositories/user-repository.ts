import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import type { Models } from '../../../../prisma/contract';
import { db } from '../../../../prisma/db';
import { varchar } from '../../../utils/varchar';

export type UserRow = Scalars<Models.public_Users>;
export type UserMembershipRow = Scalars<Models.public_WorkspaceMemberships>;
export type UserWorkspaceRow = Scalars<Models.public_Workspaces>;
export type UserRoleRow = Scalars<Models.public_WorkspaceRoles>;

export const UserRepository = {
  findUserById(id: string) {
    return db.orm.public.Users.where((u) =>
      u.id.eq(varchar<26>(id)),
    ).first();
  },

  async findMembershipsByUserId(userId: string): Promise<UserMembershipRow[]> {
    const rows = await db.orm.public.WorkspaceMemberships.where((m) =>
      m.userId.eq(varchar<26>(userId)),
    ).all();
    return rows;
  },

  async findWorkspacesByIds(ids: string[]): Promise<UserWorkspaceRow[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await db.orm.public.Workspaces.where((w) =>
      w.id.in(ids.map((id) => varchar<26>(id))),
    ).all();
    return rows;
  },

  async findRolesByIds(ids: string[]): Promise<UserRoleRow[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await db.orm.public.WorkspaceRoles.where((r) =>
      r.id.in(ids.map((id) => varchar<26>(id))),
    ).all();
    return rows;
  },
};
