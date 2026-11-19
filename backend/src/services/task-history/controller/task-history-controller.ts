import type { NextFunction, Request, Response } from 'express';
import { TaskHistoryService } from '../service/task-history-service';
import { AuthenticationError } from '../../../exceptions/index';
import { paramValue } from '../../../middlewares/authorize';
import { successResponse } from '../../../utils/response';

/** Controller history task (spec v2 §15). */
export const TaskHistoryController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = paramValue(req, 'id');
      if (!taskId) {
        throw new AuthenticationError('Unauthorized');
      }
      const history = await TaskHistoryService.listTaskHistory(taskId);
      successResponse(res, 'History task berhasil diambil', history);
    } catch (error) {
      next(error);
    }
  },
};
