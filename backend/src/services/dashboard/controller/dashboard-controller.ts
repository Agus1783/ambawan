import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';
import { DashboardService } from '../service/dashboard-service';
import {
  AuthenticationError,
  ClientError,
} from '../../../exceptions/index';
import { successResponse } from '../../../utils/response';
import {
  DashboardSummaryQuerySchema,
  DashboardTasksQuerySchema,
} from '../validator/schema';

function requireUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new AuthenticationError('Unauthorized');
  }
  return userId;
}

/**
 * Parse query string dengan skema Zod. Gagal -> 400
 * VALIDATION_ERROR (spec §18.1/§19: `workspace_id` wajib
 * diisi). `validate` tidak dipakai karena middleware itu
 * hanya memvalidasi body.
 */
function parseQuery<T>(schema: z.ZodType<T>, query: unknown): T {
  const result = schema.safeParse(query);
  if (!result.success) {
    const details: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.length > 0 ? issue.path.join('.') : 'query';
      details[key] = issue.message;
    }
    throw new ClientError(
      details.workspace_id ?? 'Query tidak valid',
      400,
      'VALIDATION_ERROR',
      details,
    );
  }
  return result.data;
}

/** Controller dashboard (spec v2 §18). */
export const DashboardController = {
  async summary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const query = parseQuery(DashboardSummaryQuerySchema, req.query);
      const summary = await DashboardService.getSummary(
        userId,
        query.workspace_id,
      );
      successResponse(res, 'Dashboard berhasil diambil', summary);
    } catch (error) {
      next(error);
    }
  },

  async taskStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const query = parseQuery(DashboardTasksQuerySchema, req.query);
      const statistics = await DashboardService.getTaskStatistics(userId, {
        workspaceId: query.workspace_id,
        projectId: query.project_id,
        divisionId: query.division_id,
      });
      successResponse(res, 'Statistik task berhasil diambil', statistics);
    } catch (error) {
      next(error);
    }
  },
};
