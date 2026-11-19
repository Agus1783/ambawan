import type { NextFunction, Request, Response } from 'express';
import { ProjectService } from '../service/project-service';
import { AuthenticationError } from '../../../exceptions/index';
import { paramValue } from '../../../middlewares/authorize';
import { successResponse } from '../../../utils/response';
import { parsePagination } from '../../../utils/pagination';
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from '../validator/schema';

function requireUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new AuthenticationError('Unauthorized');
  }
  return userId;
}

function requireProjectId(req: Request): string {
  const projectId = paramValue(req, 'id');
  if (!projectId) {
    throw new AuthenticationError('Unauthorized');
  }
  return projectId;
}

/**
 * Controller project (spec v2 §13). Endpoint :id memakai
 * middleware `authorizeProject`; list/create memakai
 * `workspace_id` dari query/body dan dicek di service.
 */
export const ProjectController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const pagination = parsePagination(req.query);
      const workspaceId =
        typeof req.query.workspace_id === 'string'
          ? req.query.workspace_id
          : undefined;
      const search =
        typeof req.query.search === 'string' ? req.query.search : undefined;
      const result = await ProjectService.listProjects(userId, {
        ...pagination,
        workspaceId,
        search,
      });
      successResponse(
        res,
        'Data project berhasil diambil',
        result.items,
        200,
        result.pagination,
      );
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const input = req.validated as CreateProjectInput;
      const project = await ProjectService.createProject(userId, input);
      successResponse(res, 'Project berhasil dibuat', project, 201);
    } catch (error) {
      next(error);
    }
  },

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await ProjectService.getProjectDetail(
        requireProjectId(req),
      );
      successResponse(res, 'Data project berhasil diambil', project);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.validated as UpdateProjectInput;
      const project = await ProjectService.updateProject(
        requireProjectId(req),
        input,
      );
      successResponse(res, 'Project berhasil diperbarui', project);
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await ProjectService.deleteProject(requireProjectId(req));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async templateTasksPreview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const templateId = paramValue(req, 'templateId');
      if (!templateId) {
        throw new AuthenticationError('Unauthorized');
      }
      const result = await ProjectService.getTemplateTasksPreview(
        userId,
        templateId,
      );
      successResponse(res, 'Template tugas berhasil diambil', result);
    } catch (error) {
      next(error);
    }
  },

  async listMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const members = await ProjectService.getProjectMembers(
        userId,
        requireProjectId(req),
      );
      successResponse(res, 'Anggota proyek berhasil diambil', members);
    } catch (error) {
      next(error);
    }
  },
};
