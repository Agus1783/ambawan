import type { NextFunction, Request, Response } from 'express';
import { TaskCommentService } from '../service/task-comment-service';
import { AuthenticationError } from '../../../exceptions/index';
import { paramValue } from '../../../middlewares/authorize';
import { successResponse } from '../../../utils/response';
import { parsePagination } from '../../../utils/pagination';
import type { CreateCommentInput } from '../validator/schema';

function requireUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new AuthenticationError('Unauthorized');
  }
  return userId;
}

/** Controller komentar task (spec v2 §17). */
export const TaskCommentController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const taskId = paramValue(req, 'id');
      if (!taskId) {
        throw new AuthenticationError('Unauthorized');
      }
      const input = req.validated as CreateCommentInput;
      const comment = await TaskCommentService.createComment(
        userId,
        taskId,
        input.content,
      );
      successResponse(res, 'Komentar berhasil ditambahkan', comment, 201);
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = paramValue(req, 'id');
      if (!taskId) {
        throw new AuthenticationError('Unauthorized');
      }
      const pagination = parsePagination(req.query);
      const result = await TaskCommentService.listComments(taskId, pagination);
      successResponse(
        res,
        'Komentar berhasil diambil',
        result.items,
        200,
        result.pagination,
      );
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const taskId = paramValue(req, 'taskId');
      const commentId = paramValue(req, 'commentId');
      if (!taskId || !commentId) {
        throw new AuthenticationError('Unauthorized');
      }
      await TaskCommentService.deleteComment(userId, taskId, commentId);
      successResponse(res, 'Komentar berhasil dihapus', null);
    } catch (error) {
      next(error);
    }
  },
};
