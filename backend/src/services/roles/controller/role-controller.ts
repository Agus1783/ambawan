import type { NextFunction, Request, Response } from 'express';
import { RoleService } from '../service/role-service';
import { AuthenticationError } from '../../../exceptions/index';
import { paramValue } from '../../../middlewares/authorize';
import { successResponse } from '../../../utils/response';
import type {
  CreateRoleInput,
  UpdateRoleInput,
} from '../validator/schema';

function requireWorkspaceId(req: Request): string {
  const workspaceId = paramValue(req, 'id');
  if (!workspaceId) {
    throw new AuthenticationError('Unauthorized');
  }
  return workspaceId;
}

function requireRoleId(req: Request): string {
  const roleId = paramValue(req, 'roleId');
  if (!roleId) {
    throw new AuthenticationError('Unauthorized');
  }
  return roleId;
}

/**
 * Controller role & katalog izin (spec v2 §10).
 */
export const RoleController = {
  getPermissionCatalog(_req: Request, res: Response) {
    const catalog = RoleService.getPermissionCatalog();
    successResponse(res, 'Katalog izin berhasil diambil', catalog);
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = requireWorkspaceId(req);
      const roles = await RoleService.listRoles(workspaceId);
      successResponse(res, 'Data role berhasil diambil', roles);
    } catch (error) {
      next(error);
    }
  },

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = requireWorkspaceId(req);
      const roleId = requireRoleId(req);
      const role = await RoleService.getRoleDetail(workspaceId, roleId);
      successResponse(res, 'Data role berhasil diambil', role);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = requireWorkspaceId(req);
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthenticationError('Unauthorized');
      }
      const input = req.validated as CreateRoleInput;
      const role = await RoleService.createRole(workspaceId, userId, input);
      successResponse(res, 'Role berhasil dibuat', role, 201);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = requireWorkspaceId(req);
      const roleId = requireRoleId(req);
      const input = req.validated as UpdateRoleInput;
      const role = await RoleService.updateRole(workspaceId, roleId, input);
      successResponse(res, 'Role berhasil diperbarui', role);
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const workspaceId = requireWorkspaceId(req);
      const roleId = requireRoleId(req);
      await RoleService.deleteRole(workspaceId, roleId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};
