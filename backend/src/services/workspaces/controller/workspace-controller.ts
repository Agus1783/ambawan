import type { NextFunction, Request, Response } from 'express';
import { WorkspaceService } from '../service/workspace-service';
import { AuthenticationError } from '../../../exceptions/index';
import { paramValue } from '../../../middlewares/authorize';
import { successResponse } from '../../../utils/response';
import { parsePagination } from '../../../utils/pagination';
import type {
  CreateWorkspaceInput,
  UpdateMemberRoleInput,
  UpdateWorkspaceInput,
} from '../validator/schema';

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
 * Controller workspace (spec v2 §8). Otorisasi ditangani
 * `authenticateToken` + `authorize(...)` di route; controller hanya
 * menerjemahkan HTTP <-> service.
 */
export const WorkspaceController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const input = req.validated as CreateWorkspaceInput;
      const workspace = await WorkspaceService.createWorkspace(userId, input);
      successResponse(res, 'Workspace berhasil dibuat', workspace, 201);
    } catch (error) {
      next(error);
    }
  },

  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const pagination = parsePagination(req.query);
      const result = await WorkspaceService.listMyWorkspaces(
        userId,
        pagination,
      );
      successResponse(
        res,
        'Data workspace berhasil diambil',
        result.items,
        200,
        result.pagination,
      );
    } catch (error) {
      next(error);
    }
  },

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = requireWorkspaceId(req);
      const workspace =
        await WorkspaceService.getWorkspaceDetail(workspaceId);
      successResponse(res, 'Data workspace berhasil diambil', workspace);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = requireWorkspaceId(req);
      const input = req.validated as UpdateWorkspaceInput;
      const workspace = await WorkspaceService.updateWorkspace(
        workspaceId,
        input,
      );
      successResponse(res, 'Workspace berhasil diperbarui', workspace);
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = requireWorkspaceId(req);
      await WorkspaceService.deleteWorkspace(workspaceId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async listMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = requireWorkspaceId(req);
      const pagination = parsePagination(req.query);
      const search =
        typeof req.query.search === 'string' ? req.query.search : undefined;
      const roleId =
        typeof req.query.role_id === 'string' ? req.query.role_id : undefined;
      const result = await WorkspaceService.listMembers(workspaceId, {
        ...pagination,
        search,
        role_id: roleId,
      });
      successResponse(
        res,
        'Anggota workspace berhasil diambil',
        result.items,
        200,
        result.pagination,
      );
    } catch (error) {
      next(error);
    }
  },

  async updateMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = requireWorkspaceId(req);
      const userId = paramValue(req, 'userId');
      if (!userId) {
        throw new AuthenticationError('Unauthorized');
      }
      const input = req.validated as UpdateMemberRoleInput;
      const member = await WorkspaceService.updateMemberRole(
        workspaceId,
        userId,
        input,
      );
      successResponse(res, 'Role anggota berhasil diperbarui', member);
    } catch (error) {
      next(error);
    }
  },

  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = requireWorkspaceId(req);
      const userId = paramValue(req, 'userId');
      if (!userId) {
        throw new AuthenticationError('Unauthorized');
      }
      await WorkspaceService.removeMember(workspaceId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
