import type { NextFunction, Request, Response } from 'express';
import { ProjectTemplateService } from '../service/project-template-service';
import { AuthenticationError } from '../../../exceptions/index';
import { paramValue } from '../../../middlewares/authorize';
import { successResponse } from '../../../utils/response';
import type {
  CreateProjectTemplateInput,
  CreateTaskTemplateInput,
  UpdateProjectTemplateInput,
  UpdateTaskTemplateInput,
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

function requireTemplateId(req: Request): string {
  const templateId = paramValue(req, 'templateId');
  if (!templateId) {
    throw new AuthenticationError('Unauthorized');
  }
  return templateId;
}

function requireTaskTemplateId(req: Request): string {
  const taskTemplateId = paramValue(req, 'taskTemplateId');
  if (!taskTemplateId) {
    throw new AuthenticationError('Unauthorized');
  }
  return taskTemplateId;
}

/**
 * Controller template proyek + template tugas (spec v2 §13.8–
 * §13.16). Route bersarang di `/workspaces/:id/project-
 * templates`; izin dicek middleware `authorize` di router.
 */
export const ProjectTemplateController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const templates = await ProjectTemplateService.listProjectTemplates(
        requireWorkspaceId(req),
      );
      successResponse(res, 'Template proyek berhasil diambil', templates);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const input = req.validated as CreateProjectTemplateInput;
      const template = await ProjectTemplateService.createProjectTemplate(
        userId,
        requireWorkspaceId(req),
        input,
      );
      successResponse(res, 'Template proyek berhasil dibuat', template, 201);
    } catch (error) {
      next(error);
    }
  },

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await ProjectTemplateService.getProjectTemplateDetail(
        requireWorkspaceId(req),
        requireTemplateId(req),
      );
      successResponse(res, 'Template proyek berhasil diambil', template);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.validated as UpdateProjectTemplateInput;
      const template = await ProjectTemplateService.updateProjectTemplate(
        requireWorkspaceId(req),
        requireTemplateId(req),
        input,
      );
      successResponse(res, 'Template proyek berhasil diubah', template);
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await ProjectTemplateService.deleteProjectTemplate(
        requireWorkspaceId(req),
        requireTemplateId(req),
      );
      successResponse(res, 'Template proyek berhasil dihapus', null);
    } catch (error) {
      next(error);
    }
  },

  async listTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const tasks = await ProjectTemplateService.listTaskTemplates(
        requireWorkspaceId(req),
        requireTemplateId(req),
      );
      successResponse(res, 'Template tugas berhasil diambil', tasks);
    } catch (error) {
      next(error);
    }
  },

  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.validated as CreateTaskTemplateInput;
      const task = await ProjectTemplateService.createTaskTemplate(
        requireWorkspaceId(req),
        requireTemplateId(req),
        input,
      );
      successResponse(res, 'Template tugas berhasil dibuat', task, 201);
    } catch (error) {
      next(error);
    }
  },

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.validated as UpdateTaskTemplateInput;
      const task = await ProjectTemplateService.updateTaskTemplate(
        requireWorkspaceId(req),
        requireTemplateId(req),
        requireTaskTemplateId(req),
        input,
      );
      successResponse(res, 'Template tugas berhasil diubah', task);
    } catch (error) {
      next(error);
    }
  },

  async removeTask(req: Request, res: Response, next: NextFunction) {
    try {
      await ProjectTemplateService.deleteTaskTemplate(
        requireWorkspaceId(req),
        requireTemplateId(req),
        requireTaskTemplateId(req),
      );
      successResponse(res, 'Template tugas berhasil dihapus', null);
    } catch (error) {
      next(error);
    }
  },
};
