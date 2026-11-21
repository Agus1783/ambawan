import { nanoid } from 'nanoid';
import { and, or } from '@prisma/orm-postgres/orm-client';
import type { TimestamptzString } from '@prisma/orm-postgres/target/codec-types';
import type { Varchar } from '@prisma/orm-postgres/target/codec-types';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import type { Models } from '../../../../prisma/contract';
import { db } from '../../../../prisma/db';
import { varchar } from '../../../utils/varchar';
import { timestamptz } from '../../invitations/repositories/invitation-repository';

export type TaskRow = Scalars<Models.public_Tasks>;
export type TaskProjectRow = Scalars<Models.public_Projects>;
export type TaskDivisionRow = Scalars<Models.public_Divisions>;
export type TaskUserRow = Scalars<Models.public_Users>;

export type OrmClient = typeof db.orm;

export type TaskFilters = {
  search?: string | undefined;
  status?: string | undefined;
  priority?: string | undefined;
  projectId?: string | undefined;
  divisionId?: string | undefined;
  assigneeId?: string | undefined;
  /** Bila diisi: hanya task dengan id di daftar ini (scope). */
  taskIds?: string[] | undefined;
};

function tasksFiltered(workspaceId: string, filters: TaskFilters) {
  return db.orm.public.Tasks.where((t) => {
    const preds = [t.workspaceId.eq(varchar<26>(workspaceId))];
    if (filters.search) {
      const pattern = `%${filters.search.replace(/[%_\\]/g, '\\$&')}%`;
      preds.push(or(t.title.ilike(pattern), t.description.ilike(pattern)));
    }
    if (filters.status) {
      preds.push(t.status.eq(varchar<30>(filters.status)));
    }
    if (filters.priority) {
      preds.push(t.priority.eq(varchar<10>(filters.priority)));
    }
    if (filters.projectId) {
      preds.push(t.projectId.eq(varchar<26>(filters.projectId)));
    }
    if (filters.divisionId) {
      preds.push(t.divisionId.eq(varchar<26>(filters.divisionId)));
    }
    if (filters.assigneeId) {
      preds.push(t.assigneeId.eq(varchar<26>(filters.assigneeId)));
    }
    if (filters.taskIds) {
      preds.push(
        t.id.in(filters.taskIds.map((id) => varchar<26>(id))),
      );
    }
    return and(...preds);
  });
}

export const TaskRepository = {
  findById(id: string) {
    return db.orm.public.Tasks.where((t) =>
      t.id.eq(varchar<26>(id)),
    ).first();
  },

  findWorkspaceById(id: string) {
    return db.orm.public.Workspaces.where((w) =>
      w.id.eq(varchar<26>(id)),
    ).first();
  },

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

  findUserById(id: string) {
    return db.orm.public.Users.where((u) =>
      u.id.eq(varchar<26>(id)),
    ).first();
  },

  findMembership(workspaceId: string, userId: string) {
    return db.orm.public.WorkspaceMemberships.where((m) =>
      m.workspaceId.eq(varchar<26>(workspaceId)),
    )
      .where((m) => m.userId.eq(varchar<26>(userId)))
      .first();
  },

  async findProjectsByIds(ids: string[]): Promise<TaskProjectRow[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await db.orm.public.Projects.where((p) =>
      p.id.in(ids.map((id) => varchar<26>(id))),
    ).all();
    return rows;
  },

  async findDivisionsByIds(ids: string[]): Promise<TaskDivisionRow[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await db.orm.public.Divisions.where((d) =>
      d.id.in(ids.map((id) => varchar<26>(id))),
    ).all();
    return rows;
  },

  async findUsersByIds(ids: string[]): Promise<TaskUserRow[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await db.orm.public.Users.where((u) =>
      u.id.in(ids.map((id) => varchar<26>(id))),
    ).all();
    return rows;
  },

  async findDivisionsLedByUser(
    workspaceId: string,
    userId: string,
  ): Promise<TaskDivisionRow[]> {
    const rows = await db.orm.public.Divisions.where((d) =>
      d.workspaceId.eq(varchar<26>(workspaceId)),
    )
      .where((d) => d.leaderId.eq(varchar<26>(userId)))
      .all();
    return rows;
  },

  /** Semua task di workspace (id + relasi) untuk hitung scope. */
  async findAllTasksInWorkspace(workspaceId: string): Promise<TaskRow[]> {
    const rows = await db.orm.public.Tasks.where((t) =>
      t.workspaceId.eq(varchar<26>(workspaceId)),
    ).all();
    return rows;
  },

  async listTasks(
    workspaceId: string,
    filters: TaskFilters,
    opts: {
      limit: number;
      offset: number;
      sort: 'deadline' | 'createdAt';
      order: 'asc' | 'desc';
    },
  ): Promise<TaskRow[]> {
    const query = tasksFiltered(workspaceId, filters);
    const ordered =
      opts.sort === 'deadline'
        ? opts.order === 'asc'
          ? query.orderBy((t) => t.deadline.asc())
          : query.orderBy((t) => t.deadline.desc())
        : opts.order === 'asc'
          ? query.orderBy((t) => t.createdAt.asc())
          : query.orderBy((t) => t.createdAt.desc());
    const rows = await ordered.limit(opts.limit).offset(opts.offset).all();
    return rows;
  },

  async countTasks(
    workspaceId: string,
    filters: TaskFilters,
  ): Promise<number> {
    const result = await tasksFiltered(workspaceId, filters).aggregate(
      (a) => ({ total: a.count() }),
    );
    return result.total;
  },

  createTask(
    data: {
      workspaceId: string;
      projectId: string;
      parentTaskId: string | null;
      title: string;
      description: string | null;
      priority: string;
      deadline: string | null;
      assigneeId: string | null;
      divisionId: string | null;
    },
    orm: OrmClient = db.orm,
  ) {
    return orm.public.Tasks.create({
      id: varchar<26>(nanoid()),
      workspaceId: varchar<26>(data.workspaceId),
      projectId: varchar<26>(data.projectId),
      parentTaskId:
        data.parentTaskId === null ? null : varchar<26>(data.parentTaskId),
      title: varchar<200>(data.title),
      description: data.description,
      // Status default kontrak: ASSIGNED.
      status: varchar<30>('ASSIGNED'),
      priority: varchar<10>(data.priority),
      deadline:
        data.deadline === null ? null : timestamptz(data.deadline),
      divisionId:
        data.divisionId === null ? null : varchar<26>(data.divisionId),
      assigneeId:
        data.assigneeId === null ? null : varchar<26>(data.assigneeId),
    });
  },

  updateTask(
    id: string,
    data: {
      title?: string | undefined;
      description?: string | undefined;
      priority?: string | undefined;
      deadline?: string | undefined;
      assigneeId?: string | null | undefined;
      divisionId?: string | null | undefined;
      status?: string | undefined;
    },
    orm: OrmClient = db.orm,
  ) {
    const updateData: {
      title?: Varchar<200>;
      description?: string | null;
      priority?: Varchar<10>;
      deadline?: TimestamptzString | null;
      assigneeId?: Varchar<26> | null;
      divisionId?: Varchar<26> | null;
      status?: Varchar<30>;
    } = {};
    if (data.title !== undefined) {
      updateData.title = varchar<200>(data.title);
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.priority !== undefined) {
      updateData.priority = varchar<10>(data.priority);
    }
    if (data.deadline !== undefined) {
      updateData.deadline = timestamptz(data.deadline);
    }
    if (data.assigneeId !== undefined) {
      updateData.assigneeId =
        data.assigneeId === null ? null : varchar<26>(data.assigneeId);
    }
    if (data.divisionId !== undefined) {
      updateData.divisionId =
        data.divisionId === null ? null : varchar<26>(data.divisionId);
    }
    if (data.status !== undefined) {
      updateData.status = varchar<30>(data.status);
    }
    return orm.public.Tasks.where((t) =>
      t.id.eq(varchar<26>(id)),
    ).update(updateData);
  },

  deleteTask(id: string, orm: OrmClient = db.orm) {
    return orm.public.Tasks.where((t) =>
      t.id.eq(varchar<26>(id)),
    ).delete();
  },

  async findSubtasks(taskId: string): Promise<TaskRow[]> {
    const rows = await db.orm.public.Tasks.where((t) =>
      t.parentTaskId.eq(varchar<26>(taskId)),
    )
      .orderBy((t) => t.createdAt.asc())
      .all();
    return rows;
  },

  async findTaskAssigneeIdsByDivision(
    divisionId: string,
  ): Promise<string[]> {
    const rows = await db.orm.public.Tasks.where((t) =>
      t.divisionId.eq(varchar<26>(divisionId)),
    )
      .where((t) => t.assigneeId.isNotNull())
      .all();
    return [...new Set(rows.map((t) => t.assigneeId as string))];
  },
};
