import { nanoid } from 'nanoid';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import type { Models } from '../../../../prisma/contract';
import { db } from '../../../../prisma/db';
import { varchar } from '../../../utils/varchar';

export type TaskCommentRow = Scalars<Models.public_TaskComments>;
export type CommentUserRow = Scalars<Models.public_Users>;

export type OrmClient = typeof db.orm;

export const TaskCommentRepository = {
  findById(id: string) {
    return db.orm.public.TaskComments.where((c) =>
      c.id.eq(varchar<26>(id)),
    ).first();
  },

  findByTaskAndId(taskId: string, commentId: string) {
    return db.orm.public.TaskComments.where((c) =>
      c.taskId.eq(varchar<26>(taskId)),
    )
      .where((c) => c.id.eq(varchar<26>(commentId)))
      .first();
  },

  async listByTask(
    taskId: string,
    opts: { limit: number; offset: number },
  ): Promise<TaskCommentRow[]> {
    const rows = await db.orm.public.TaskComments.where((c) =>
      c.taskId.eq(varchar<26>(taskId)),
    )
      .orderBy((c) => c.createdAt.asc())
      .limit(opts.limit)
      .offset(opts.offset)
      .all();
    return rows;
  },

  async countByTask(taskId: string): Promise<number> {
    const result = await db.orm.public.TaskComments.where((c) =>
      c.taskId.eq(varchar<26>(taskId)),
    ).aggregate((a) => ({ total: a.count() }));
    return result.total;
  },

  createComment(
    data: { taskId: string; userId: string; content: string },
    orm: OrmClient = db.orm,
  ) {
    return orm.public.TaskComments.create({
      id: varchar<26>(nanoid()),
      taskId: varchar<26>(data.taskId),
      userId: varchar<26>(data.userId),
      content: data.content,
    });
  },

  deleteComment(id: string, orm: OrmClient = db.orm) {
    return orm.public.TaskComments.where((c) =>
      c.id.eq(varchar<26>(id)),
    ).delete();
  },

  async findUsersByIds(ids: string[]): Promise<CommentUserRow[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await db.orm.public.Users.where((u) =>
      u.id.in(ids.map((id) => varchar<26>(id))),
    ).all();
    return rows;
  },
};
