import { nanoid } from 'nanoid';
import { and, or } from '@prisma/orm-postgres/orm-client';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import type { Models } from '../../../../prisma/contract';
import { db } from '../../../../prisma/db';
import { varchar } from '../../../utils/varchar';

export type WorkspaceRow = Scalars<Models.public_Workspaces>;
export type MembershipRow = Scalars<Models.public_WorkspaceMemberships>;
export type WorkspaceRoleRow = Scalars<Models.public_WorkspaceRoles>;
export type IndustryRow = Scalars<Models.public_Industries>;
export type WorkspaceUserRow = Scalars<Models.public_Users>;

/** Tipe klien ORM — dipakai agar repository bisa berjalan di dalam
 *  transaksi (`tx.orm`) maupun langsung (`db.orm`). */
export type OrmClient = typeof db.orm;

function membershipsFiltered(
  workspaceId: string,
  opts: { roleId?: string | undefined; userIds?: string[] | undefined },
) {
  return db.orm.public.WorkspaceMemberships.where((m) => {
    const preds = [m.workspaceId.eq(varchar<26>(workspaceId))];
    if (opts.roleId) {
      preds.push(m.roleId.eq(varchar<26>(opts.roleId)));
    }
    if (opts.userIds) {
      preds.push(
        m.userId.in(opts.userIds.map((id) => varchar<26>(id))),
      );
    }
    return and(...preds);
  });
}

export const WorkspaceRepository = {
  findWorkspaceById(id: string) {
    return db.orm.public.Workspaces.where((w) =>
      w.id.eq(varchar<26>(id)),
    ).first();
  },

  findWorkspaceByOwnerId(userId: string) {
    return db.orm.public.Workspaces.where((w) =>
      w.ownerId.eq(varchar<26>(userId)),
    ).first();
  },

  async findWorkspacesByIds(ids: string[]): Promise<WorkspaceRow[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await db.orm.public.Workspaces.where((w) =>
      w.id.in(ids.map((id) => varchar<26>(id))),
    ).all();
    return rows;
  },

  async findMembershipsByUser(userId: string): Promise<MembershipRow[]> {
    const rows = await db.orm.public.WorkspaceMemberships.where((m) =>
      m.userId.eq(varchar<26>(userId)),
    ).all();
    return rows;
  },

  findMembership(workspaceId: string, userId: string) {
    return db.orm.public.WorkspaceMemberships.where((m) =>
      m.workspaceId.eq(varchar<26>(workspaceId)),
    )
      .where((m) => m.userId.eq(varchar<26>(userId)))
      .first();
  },

  findRoleById(roleId: string) {
    return db.orm.public.WorkspaceRoles.where((r) =>
      r.id.eq(varchar<26>(roleId)),
    ).first();
  },

  async findRolesByIds(ids: string[]): Promise<WorkspaceRoleRow[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await db.orm.public.WorkspaceRoles.where((r) =>
      r.id.in(ids.map((id) => varchar<26>(id))),
    ).all();
    return rows;
  },

  findSystemRoleByName(name: string) {
    return db.orm.public.WorkspaceRoles.where((r) =>
      r.name.eq(varchar<100>(name)),
    )
      .where((r) => r.isSystem.eq(true))
      .first();
  },

  findIndustryById(id: string) {
    return db.orm.public.Industries.where((i) =>
      i.id.eq(varchar<26>(id)),
    ).first();
  },

  async findIndustriesByIds(ids: string[]): Promise<IndustryRow[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await db.orm.public.Industries.where((i) =>
      i.id.in(ids.map((id) => varchar<26>(id))),
    ).all();
    return rows;
  },

  findUserById(id: string) {
    return db.orm.public.Users.where((u) =>
      u.id.eq(varchar<26>(id)),
    ).first();
  },

  async findUsersByIds(ids: string[]): Promise<WorkspaceUserRow[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await db.orm.public.Users.where((u) =>
      u.id.in(ids.map((id) => varchar<26>(id))),
    ).all();
    return rows;
  },

  async findUsersBySearch(
    search: string,
    limit = 200,
  ): Promise<WorkspaceUserRow[]> {
    const pattern = `%${search.replace(/[%_\\]/g, '\\$&')}%`;
    const rows = await db.orm.public.Users.where((u) =>
      or(u.name.ilike(pattern), u.email.ilike(pattern)),
    )
      .limit(limit)
      .all();
    return rows;
  },

  async countMembers(workspaceId: string): Promise<number> {
    const result = await db.orm.public.WorkspaceMemberships.where((m) =>
      m.workspaceId.eq(varchar<26>(workspaceId)),
    ).aggregate((a) => ({ total: a.count() }));
    return result.total;
  },

  async listMemberships(
    workspaceId: string,
    opts: {
      roleId?: string | undefined;
      userIds?: string[] | undefined;
      limit: number;
      offset: number;
    },
  ): Promise<MembershipRow[]> {
    const rows = await membershipsFiltered(workspaceId, opts)
      .orderBy((m) => m.createdAt.asc())
      .limit(opts.limit)
      .offset(opts.offset)
      .all();
    return rows;
  },

  async countMemberships(
    workspaceId: string,
    opts: { roleId?: string | undefined; userIds?: string[] | undefined },
  ): Promise<number> {
    const result = await membershipsFiltered(workspaceId, opts).aggregate(
      (a) => ({ total: a.count() }),
    );
    return result.total;
  },

  createWorkspace(
    data: { name: string; industryId: string; ownerId: string },
    orm: OrmClient = db.orm,
  ) {
    return orm.public.Workspaces.create({
      id: varchar<26>(nanoid()),
      name: varchar<150>(data.name),
      industryId: varchar<26>(data.industryId),
      ownerId: varchar<26>(data.ownerId),
    });
  },

  createMembership(
    data: { workspaceId: string; userId: string; roleId: string },
    orm: OrmClient = db.orm,
  ) {
    return orm.public.WorkspaceMemberships.create({
      id: varchar<26>(nanoid()),
      workspaceId: varchar<26>(data.workspaceId),
      userId: varchar<26>(data.userId),
      roleId: varchar<26>(data.roleId),
    });
  },

  setUserOnboarding(
    userId: string,
    completed: boolean,
    orm: OrmClient = db.orm,
  ) {
    return orm.public.Users.where((u) =>
      u.id.eq(varchar<26>(userId)),
    ).update({
      onboardingCompleted: completed,
    });
  },

  updateWorkspace(
    id: string,
    data: { name?: string | undefined; industryId?: string | undefined },
  ) {
    const patch: {
      name?: ReturnType<typeof varchar<150>>;
      industryId?: ReturnType<typeof varchar<26>>;
    } = {};
    if (data.name !== undefined) {
      patch.name = varchar<150>(data.name);
    }
    if (data.industryId !== undefined) {
      patch.industryId = varchar<26>(data.industryId);
    }
    return db.orm.public.Workspaces.where((w) =>
      w.id.eq(varchar<26>(id)),
    ).update(patch);
  },

  deleteWorkspace(id: string) {
    return db.orm.public.Workspaces.where((w) =>
      w.id.eq(varchar<26>(id)),
    ).delete();
  },

  updateMembershipRole(workspaceId: string, userId: string, roleId: string) {
    return db.orm.public.WorkspaceMemberships.where((m) =>
      m.workspaceId.eq(varchar<26>(workspaceId)),
    )
      .where((m) => m.userId.eq(varchar<26>(userId)))
      .update({
        roleId: varchar<26>(roleId),
      });
  },

  deleteMembership(workspaceId: string, userId: string) {
    return db.orm.public.WorkspaceMemberships.where((m) =>
      m.workspaceId.eq(varchar<26>(workspaceId)),
    )
      .where((m) => m.userId.eq(varchar<26>(userId)))
      .delete();
  },

  async clearDivisionLeaders(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    // Mengeluarkan ketua divisi mengosongkan leader_id divisi yang
    // dipimpinnya (spec §8.8): ON DELETE SET NULL tidak berlaku di
    // sini karena yang dihapus adalah membership, bukan user.
    await db.orm.public.Divisions.where((d) =>
      d.workspaceId.eq(varchar<26>(workspaceId)),
    )
      .where((d) => d.leaderId.eq(varchar<26>(userId)))
      .updateAll({ leaderId: null });
  },
};
