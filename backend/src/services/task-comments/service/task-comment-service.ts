import { db } from '../../../../prisma/db';
import { TaskCommentRepository } from '../repositories/task-comment-repository';
import type { TaskCommentRow } from '../repositories/task-comment-repository';
import { TaskHistoryRepository } from '../../task-history/repositories/task-history-repository';
import {
  assertTaskPermission,
  loadTask,
} from '../../../middlewares/authorize-task';
import {
  AuthorizationError,
  NotFoundError,
} from '../../../exceptions/index';
import { buildPaginationMeta, offsetOf } from '../../../utils/pagination';

function toComment(
  row: TaskCommentRow,
  user: { id: string; name: string } | undefined,
) {
  return {
    id: row.id,
    task_id: row.taskId,
    content: row.content,
    user: user ? { id: user.id, name: user.name } : null,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

/**
 * Komentar task (spec v2 §17). Hapus komentar boleh dilakukan
 * penulisnya sendiri, atau pengguna yang punya izin
 * `task.delete` atas task tersebut.
 */
export const TaskCommentService = {
  async createComment(
    userId: string,
    taskId: string,
    content: string,
  ) {
    const comment = await db.transaction(async (tx) => {
      const created = await TaskCommentRepository.createComment(
        { taskId, userId, content },
        tx.orm,
      );
      await TaskHistoryRepository.createHistory(
        {
          taskId,
          userId,
          action: 'COMMENT_ADDED',
          description: 'Komentar ditambahkan',
        },
        tx.orm,
      );
      return created;
    });
    const users = await TaskCommentRepository.findUsersByIds([userId]);
    return toComment(comment, users[0]);
  },

  async listComments(
    taskId: string,
    opts: { page: number; limit: number },
  ) {
    const [rows, total] = await Promise.all([
      TaskCommentRepository.listByTask(taskId, {
        limit: opts.limit,
        offset: offsetOf(opts.page, opts.limit),
      }),
      TaskCommentRepository.countByTask(taskId),
    ]);
    const users = await TaskCommentRepository.findUsersByIds([
      ...new Set(rows.map((r) => r.userId)),
    ]);
    const userById = new Map(users.map((u) => [u.id, u]));
    return {
      items: rows.map((row) => toComment(row, userById.get(row.userId))),
      pagination: buildPaginationMeta(opts.page, opts.limit, total),
    };
  },

  async deleteComment(
    userId: string,
    taskId: string,
    commentId: string,
  ) {
    const task = await loadTask(taskId);
    const comment = await TaskCommentRepository.findByTaskAndId(
      task.id,
      commentId,
    );
    if (!comment) {
      throw new NotFoundError(
        'Komentar tidak ditemukan',
        'COMMENT_NOT_FOUND',
      );
    }

    if (comment.userId !== userId) {
      // Bukan penulis: butuh izin task.delete atas task ini.
      // assertTaskPermission melempar FORBIDDEN bila tidak ada
      // izin, atau TASK_ACCESS_DENIED bila task di luar scope.
      try {
        await assertTaskPermission(userId, task, 'task.delete');
      } catch (error) {
        if (
          error instanceof AuthorizationError &&
          error.code === 'TASK_ACCESS_DENIED'
        ) {
          throw new AuthorizationError(
            'Pemanggil bukan penulis komentar dan tidak memiliki task.delete',
            'FORBIDDEN',
          );
        }
        throw error;
      }
    }

    await db.transaction(async (tx) => {
      await TaskCommentRepository.deleteComment(comment.id, tx.orm);
      await TaskHistoryRepository.createHistory(
        {
          taskId: task.id,
          userId,
          action: 'COMMENT_DELETED',
          description: 'Komentar dihapus',
        },
        tx.orm,
      );
    });
  },
};
