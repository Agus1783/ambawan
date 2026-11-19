import type { NextFunction, Request, Response } from 'express';
import { TaskService } from '../service/task-service';
import { AuthenticationError } from '../../../exceptions/index';
import { paramValue } from '../../../middlewares/authorize';
import { successResponse } from '../../../utils/response';
import { parsePagination } from '../../../utils/pagination';
import type {
  CreateTaskInput,
  DelegateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from '../validator/schema';

function requireUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new AuthenticationError('Unauthorized');
  }
  return userId;
}

function requireTaskId(req: Request): string {
  const taskId = paramValue(req, 'id');
  if (!taskId) {
    throw new AuthenticationError('Unauthorized');
  }
  return taskId;
}

function optionalQueryParam(
  req: Request,
  name: string,
): string | undefined {
  const value = req.query[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * Controller task (spec v2 §14). Endpoint :id memakai
 * middleware `authorizeTask`; list/create memakai
 * `workspace_id` dari query/body dan dicek di service.
 */
export const TaskController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const pagination = parsePagination(req.query);
      const workspaceId = optionalQueryParam(req, 'workspace_id');
      const sortParam = optionalQueryParam(req, 'sort');
      const orderParam = optionalQueryParam(req, 'order');
      const result = await TaskService.listTasks(userId, {
        ...pagination,
        workspaceId,
        search: optionalQueryParam(req, 'search'),
        status: optionalQueryParam(req, 'status'),
        priority: optionalQueryParam(req, 'priority'),
        projectId: optionalQueryParam(req, 'project_id'),
        divisionId: optionalQueryParam(req, 'division_id'),
        assigneeId: optionalQueryParam(req, 'assignee_id'),
        sort: sortParam === 'deadline' ? 'deadline' : 'createdAt',
        order: orderParam === 'asc' ? 'asc' : 'desc',
      });
      successResponse(
        res,
        'Data task berhasil diambil',
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
      const input = req.validated as CreateTaskInput;
      const task = await TaskService.createTask(userId, input);
      successResponse(res, 'Task berhasil dibuat', task, 201);
    } catch (error) {
      next(error);
    }
  },

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await TaskService.getTaskDetail(requireTaskId(req));
      successResponse(res, 'Data task berhasil diambil', task);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const input = req.validated as UpdateTaskInput;
      const task = await TaskService.updateTask(
        userId,
        requireTaskId(req),
        input,
      );
      successResponse(res, 'Task berhasil diperbarui', task);
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await TaskService.deleteTask(requireTaskId(req));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const input = req.validated as UpdateTaskStatusInput;
      const task = await TaskService.updateTaskStatus(
        userId,
        requireTaskId(req),
        input.status,
      );
      successResponse(res, 'Status task berhasil diperbarui', task);
    } catch (error) {
      next(error);
    }
  },

  async delegate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const input = req.validated as DelegateTaskInput;
      const task = await TaskService.delegateTask(
        userId,
        requireTaskId(req),
        input,
      );
      successResponse(res, 'Task berhasil didelegasikan', task);
    } catch (error) {
      next(error);
    }
  },

  async listSubtasks(req: Request, res: Response, next: NextFunction) {
    try {
      const subtasks = await TaskService.getSubtasks(requireTaskId(req));
      successResponse(res, 'Subtask berhasil diambil', subtasks);
    } catch (error) {
      next(error);
    }
  },
};
