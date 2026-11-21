import { nanoid } from 'nanoid';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import type { Models } from '../../../../prisma/contract';
import { db } from '../../../../prisma/db';
import { varchar } from '../../../utils/varchar';

export type TaskHistoryRow = Scalars<Models.public_TaskHistory>;
export type HistoryUserRow = Scalars<Models.public_Users>;

export type OrmClient = typeof db.orm;

/** Action yang direkomendasikan spec §15.1. */
export const HISTORY_ACTIONS = [
  'CREATED',
  'UPDATED',
  'DELEGATED',
  'STATUS_CHANGED',
  'ATTACHMENT_ADDED',
  'ATTACHMENT_DELETED',
  'COMMENT_ADDED',
  'COMMENT_DELETED',
] as const;

export type HistoryAction = (typeof HISTORY_ACTIONS)[number];

export const TaskHistoryRepository = {
  createHistory(
    data: {
      taskId: string;
      userId: string;
      action: HistoryAction;
      oldStatus?: string | null | undefined;
      newStatus?: string | null | undefined;
      description?: string | null | undefined;
    },
    orm: OrmClient = db.orm,
  ) {
    return orm.public.TaskHistory.create({
      id: varchar<26>(nanoid()),
      taskId: varchar<26>(data.taskId),
      userId: varchar<26>(data.userId),
      action: varchar<50>(data.action),
      oldStatus:
        data.oldStatus === undefined || data.oldStatus === null
          ? null
          : varchar<30>(data.oldStatus),
      newStatus:
        data.newStatus === undefined || data.newStatus === null
          ? null
          : varchar<30>(data.newStatus),
      description: data.description ?? null,
    });
  },

  async listHistoryByTask(taskId: string): Promise<TaskHistoryRow[]> {
    const rows = await db.orm.public.TaskHistory.where((h) =>
      h.taskId.eq(varchar<26>(taskId)),
    )
      .orderBy((h) => h.createdAt.asc())
      .all();
    return rows;
  },

  async findUsersByIds(ids: string[]): Promise<HistoryUserRow[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await db.orm.public.Users.where((u) =>
      u.id.in(ids.map((id) => varchar<26>(id))),
    ).all();
    return rows;
  },
};
