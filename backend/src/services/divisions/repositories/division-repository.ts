import { nanoid } from 'nanoid';
import { and } from '@prisma/orm-postgres/orm-client';
import type { Varchar } from '@prisma/orm-postgres/target/codec-types';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import type { Models } from '../../../../prisma/contract';
import { db } from '../../../../prisma/db';
import { varchar } from '../../../utils/varchar';

export type DivisionRow = Scalars<Models.public_Divisions>;
export type DivisionUserRow = Scalars<Models.public_Users>;
export type DivisionRoleRow = Scalars<Models.public_WorkspaceRoles>;
export type DivisionMembershipRow =
  Scalars<Models.public_WorkspaceMemberships>;

export type OrmClient = typeof db.orm;

function divisionsFiltered(
  workspaceId: string,
  opts: { search?: string | undefined },
) {
  return db.orm.public.Divisions.where((d) => {
    const preds = [d.workspaceId.eq(varchar<26>(workspaceId))];
    if (opts.search) {
      preds.push(d.name.ilike(`%${opts.search.replace(/[%_\\]/g, '\\$&')}%`));
    }
    return and(...preds);
  });
}

export const DivisionRepository = {
  findById(id: string) {
    return db.orm.public.Divisions.where((d) =>
      d.id.eq(varchar<26>(id)),
    ).first();
  },

  findByWorkspaceAndName(workspaceId: string, name: string) {
    return db.orm.public.Divisions.where((d) =>
      d.workspaceId.eq(varchar<26>(workspaceId)),
    )
      .where((d) => d.name.eq(varchar<100>(name)))
      .first();
  },

  findUserById(id: string) {
    return db.orm.public.Users.where((u) =>
      u.id.eq(varchar<26>(id)),
    ).first();
  },

  async findUsersByIds(ids: string[]): Promise<DivisionUserRow[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await db.orm.public.Users.where((u) =>
      u.id.in(ids.map((id) => varchar<26>(id))),
    ).all();
    return rows;
  },

  async findMembershipsByUserIds(
    workspaceId: string,
    userIds: string[],
  ): Promise<DivisionMembershipRow[]> {
    if (userIds.length === 0) {
      return [];
    }
    const rows = await db.orm.public.WorkspaceMemberships.where((m) =>
      m.workspaceId.eq(varchar<26>(workspaceId)),
    )
      .where((m) => m.userId.in(userIds.map((id) => varchar<26>(id))))
      .all();
    return rows;
  },

  async findRolesByIds(ids: string[]): Promise<DivisionRoleRow[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await db.orm.public.WorkspaceRoles.where((r) =>
      r.id.in(ids.map((id) => varchar<26>(id))),
    ).all();
    return rows;
  },

  async listDivisions(
    workspaceId: string,
    opts: { search?: string | undefined; limit: number; offset: number },
  ): Promise<DivisionRow[]> {
    const rows = await divisionsFiltered(workspaceId, opts)
      .orderBy((d) => d.createdAt.asc())
      .limit(opts.limit)
      .offset(opts.offset)
      .all();
    return rows;
  },

  async countDivisions(
    workspaceId: string,
    opts: { search?: string | undefined },
  ): Promise<number> {
    const result = await divisionsFiltered(workspaceId, opts).aggregate(
      (a) => ({ total: a.count() }),
    );
    return result.total;
  },

  createDivision(
    data: { workspaceId: string; name: string },
    orm: OrmClient = db.orm,
  ) {
    return orm.public.Divisions.create({
      id: varchar<26>(nanoid()),
      workspaceId: varchar<26>(data.workspaceId),
      name: varchar<100>(data.name),
      leaderId: null,
    });
  },

  updateDivision(
    id: string,
    data: { name?: string | undefined; leaderId?: string | null | undefined },
    orm: OrmClient = db.orm,
  ) {
    const updateData: {
      name?: Varchar<100>;
      leaderId?: Varchar<26> | null;
    } = {};
    if (data.name !== undefined) {
      updateData.name = varchar<100>(data.name);
    }
    if (data.leaderId !== undefined) {
      updateData.leaderId =
        data.leaderId === null ? null : varchar<26>(data.leaderId);
    }
    return orm.public.Divisions.where((d) =>
      d.id.eq(varchar<26>(id)),
    ).update(updateData);
  },

  deleteDivision(id: string, orm: OrmClient = db.orm) {
    return orm.public.Divisions.where((d) =>
      d.id.eq(varchar<26>(id)),
    ).delete();
  },

  async countTasksByDivision(divisionId: string): Promise<number> {
    const result = await db.orm.public.Tasks.where((t) =>
      t.divisionId.eq(varchar<26>(divisionId)),
    ).aggregate((a) => ({ total: a.count() }));
    return result.total;
  },

  /** ID assignee yang berbeda dari semua task di divisi ini. */
  async findTaskAssigneeIds(divisionId: string): Promise<string[]> {
    const rows = await db.orm.public.Tasks.where((t) =>
      t.divisionId.eq(varchar<26>(divisionId)),
    )
      .where((t) => t.assigneeId.isNotNull())
      .all();
    return [...new Set(rows.map((t) => t.assigneeId as string))];
  },
};
