import { nanoid } from 'nanoid';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import type { Models } from '../../../../prisma/contract';
import { db } from '../../../../prisma/db';
import { varchar } from '../../../utils/varchar';

export type RoleRow = Scalars<Models.public_WorkspaceRoles>;
export type RolePermissionRow = Scalars<Models.public_RolePermissions>;

export type OrmClient = typeof db.orm;

export const RoleRepository = {
  findById(roleId: string) {
    return db.orm.public.WorkspaceRoles.where((r) =>
      r.id.eq(varchar<26>(roleId)),
    ).first();
  },

  async listSystemRoles(): Promise<RoleRow[]> {
    const rows = await db.orm.public.WorkspaceRoles.where((r) =>
      r.isSystem.eq(true),
    )
      .orderBy((r) => r.name.asc())
      .all();
    return rows;
  },

  async listCustomRolesByWorkspace(workspaceId: string): Promise<RoleRow[]> {
    const rows = await db.orm.public.WorkspaceRoles.where((r) =>
      r.workspaceId.eq(varchar<26>(workspaceId)),
    )
      .orderBy((r) => r.name.asc())
      .all();
    return rows;
  },

  findByNameInWorkspace(name: string, workspaceId: string) {
    return db.orm.public.WorkspaceRoles.where((r) =>
      r.name.eq(varchar<100>(name)),
    )
      .where((r) => r.workspaceId.eq(varchar<26>(workspaceId)))
      .first();
  },

  async findPermissionsByRoles(
    roleIds: string[],
  ): Promise<RolePermissionRow[]> {
    if (roleIds.length === 0) {
      return [];
    }
    const rows = await db.orm.public.RolePermissions.where((p) =>
      p.roleId.in(roleIds.map((id) => varchar<26>(id))),
    ).all();
    return rows;
  },

  createRole(
    data: {
      name: string;
      description?: string | undefined;
      workspaceId: string;
      createdBy: string;
    },
    orm: OrmClient = db.orm,
  ) {
    return orm.public.WorkspaceRoles.create({
      id: varchar<26>(nanoid()),
      workspaceId: varchar<26>(data.workspaceId),
      name: varchar<100>(data.name),
      description: data.description ?? null,
      isSystem: false,
      createdBy: varchar<26>(data.createdBy),
    });
  },

  async createPermissions(
    roleId: string,
    permissions: string[],
    orm: OrmClient = db.orm,
  ): Promise<void> {
    for (const permission of permissions) {
      await orm.public.RolePermissions.create({
        id: varchar<26>(nanoid()),
        roleId: varchar<26>(roleId),
        permission: varchar<50>(permission),
      });
    }
  },

  updateRole(
    roleId: string,
    data: { name?: string | undefined; description?: string | undefined },
    orm: OrmClient = db.orm,
  ) {
    const patch: {
      name?: ReturnType<typeof varchar<100>>;
      description?: string | null;
    } = {};
    if (data.name !== undefined) {
      patch.name = varchar<100>(data.name);
    }
    if (data.description !== undefined) {
      patch.description = data.description;
    }
    return orm.public.WorkspaceRoles.where((r) =>
      r.id.eq(varchar<26>(roleId)),
    ).update(patch);
  },

  async replacePermissions(
    roleId: string,
    permissions: string[],
    orm: OrmClient = db.orm,
  ): Promise<void> {
    await orm.public.RolePermissions.where((p) =>
      p.roleId.eq(varchar<26>(roleId)),
    ).deleteAll();
    await RoleRepository.createPermissions(roleId, permissions, orm);
  },

  deleteRole(roleId: string) {
    return db.orm.public.WorkspaceRoles.where((r) =>
      r.id.eq(varchar<26>(roleId)),
    ).delete();
  },

  async countMembershipsByRole(roleId: string): Promise<number> {
    const result = await db.orm.public.WorkspaceMemberships.where((m) =>
      m.roleId.eq(varchar<26>(roleId)),
    ).aggregate((a) => ({ total: a.count() }));
    return result.total;
  },

  async countPendingInvitationsByRole(roleId: string): Promise<number> {
    const result = await db.orm.public.Invitations.where((i) =>
      i.roleId.eq(varchar<26>(roleId)),
    )
      .where((i) => i.status.eq(varchar<20>('PENDING')))
      .aggregate((a) => ({ total: a.count() }));
    return result.total;
  },
};
