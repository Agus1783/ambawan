import type { NextFunction, Request, Response } from 'express';
import { InvitationService } from '../service/invitation-service';
import { AuthenticationError } from '../../../exceptions/index';
import { paramValue } from '../../../middlewares/authorize';
import { successResponse } from '../../../utils/response';
import { parsePagination } from '../../../utils/pagination';
import type { CreateInvitationInput } from '../validator/schema';

function requireUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new AuthenticationError('Unauthorized');
  }
  return userId;
}

function requireWorkspaceId(req: Request): string {
  const workspaceId = paramValue(req, 'id');
  if (!workspaceId) {
    throw new AuthenticationError('Unauthorized');
  }
  return workspaceId;
}

/**
 * Controller undangan (spec v2 §11).
 */
export const InvitationController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = requireWorkspaceId(req);
      const userId = requireUserId(req);
      const input = req.validated as CreateInvitationInput;
      const invitation = await InvitationService.createInvitation(
        workspaceId,
        userId,
        input,
      );
      successResponse(res, 'Undangan berhasil dikirim', invitation, 201);
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = requireWorkspaceId(req);
      const pagination = parsePagination(req.query);
      const status =
        typeof req.query.status === 'string' ? req.query.status : undefined;
      const result = await InvitationService.listInvitations(workspaceId, {
        ...pagination,
        status,
      });
      successResponse(
        res,
        'Data undangan berhasil diambil',
        result.items,
        200,
        result.pagination,
      );
    } catch (error) {
      next(error);
    }
  },

  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const token = paramValue(req, 'token');
      if (!token) {
        throw new AuthenticationError('Unauthorized');
      }
      const userId = requireUserId(req);
      const result = await InvitationService.acceptInvitation(token, userId);
      successResponse(res, 'Undangan berhasil diterima', result);
    } catch (error) {
      next(error);
    }
  },

  async decline(req: Request, res: Response, next: NextFunction) {
    try {
      const token = paramValue(req, 'token');
      if (!token) {
        throw new AuthenticationError('Unauthorized');
      }
      const userId = requireUserId(req);
      const result = await InvitationService.declineInvitation(token, userId);
      successResponse(res, 'Undangan berhasil ditolak', result);
    } catch (error) {
      next(error);
    }
  },

  async resend(req: Request, res: Response, next: NextFunction) {
    try {
      const invitationId = paramValue(req, 'id');
      if (!invitationId) {
        throw new AuthenticationError('Unauthorized');
      }
      const userId = requireUserId(req);
      const result = await InvitationService.resendInvitation(
        invitationId,
        userId,
      );
      successResponse(res, 'Undangan berhasil dikirim ulang', result);
    } catch (error) {
      next(error);
    }
  },
};
