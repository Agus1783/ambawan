import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import type { Models } from '../../../../prisma/contract';
import { db } from '../../../../prisma/db';
import { varchar } from '../../../utils/varchar';

export type DashboardTaskRow = Scalars<Models.public_Tasks>;
export type DashboardProjectRow = Scalars<Models.public_Projects>;
export type DashboardDivisionRow = Scalars<Models.public_Divisions>;

export const DashboardRepository = {
  findProjectById(id: string) {
    return db.orm.public.Projects.where((p) =>
      p.id.eq(varchar<26>(id)),
    ).first();
  },

  findDivisionById(id: string) {
    return db.orm.public.Divisions.where((d) =>
      d.id.eq(varchar<26>(id)),
    ).first();
  },

  async findDivisionsLedByUser(
    workspaceId: string,
    userId: string,
  ): Promise<DashboardDivisionRow[]> {
    const rows = await db.orm.public.Divisions.where((d) =>
      d.workspaceId.eq(varchar<26>(workspaceId)),
    )
      .where((d) => d.leaderId.eq(varchar<26>(userId)))
      .all();
    return rows;
  },

  /** Semua task di workspace (untuk agregasi + hitung scope). */
  async findTasksInWorkspace(
    workspaceId: string,
  ): Promise<DashboardTaskRow[]> {
    const rows = await db.orm.public.Tasks.where((t) =>
      t.workspaceId.eq(varchar<26>(workspaceId)),
    ).all();
    return rows;
  },
};
