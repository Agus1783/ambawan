import type { NextFunction, Request, Response } from 'express';
import { UserService } from '../service/user-service';
import { AuthenticationError } from '../../../exceptions/index';
import { paramValue } from '../../../middlewares/authorize';
import { successResponse } from '../../../utils/response';

/** Controller users (spec v2 §7). */
export const UserController = {
  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthenticationError('Unauthorized');
      }
      const targetId = paramValue(req, 'id');
      if (!targetId) {
        throw new AuthenticationError('Unauthorized');
      }
      const user = await UserService.getUserDetail(userId, targetId);
      successResponse(res, 'Data user berhasil diambil', user);
    } catch (error) {
      next(error);
    }
  },
};
