import type { NextFunction, Request, Response } from 'express';
import { DivisionService } from '../service/division-service';
import { AuthenticationError } from '../../../exceptions/index';
import { paramValue } from '../../../middlewares/authorize';
import { successResponse } from '../../../utils/response';
import { parsePagination } from '../../../utils/pagination';
import type {
  CreateDivisionInput,
  SetDivisionLeaderInput,
  UpdateDivisionInput,
} from '../validator/schema';

function requireUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new AuthenticationError('Unauthorized');
  }
  return userId;
}

function requireDivisionId(req: Request): string {
  const divisionId = paramValue(req, 'id');
  if (!divisionId) {
    throw new AuthenticationError('Unauthorized');
  }
  return divisionId;
}

/**
 * Controller divisi (spec v2 §12). Workspace di-resolve dari
 * query/body/data divisi, bukan dari path — karena route-nya
 * top-level `/divisions`.
 */
export const DivisionController = {
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
      const result = await DivisionService.listDivisions(userId, {
        ...pagination,
        workspaceId,
        search,
      });
      successResponse(
        res,
        'Data division berhasil diambil',
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
      const input = req.validated as CreateDivisionInput;
      const division = await DivisionService.createDivision(userId, input);
      successResponse(res, 'Division berhasil dibuat', division, 201);
    } catch (error) {
      next(error);
    }
  },

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const division = await DivisionService.getDivisionDetail(
        userId,
        requireDivisionId(req),
      );
      successResponse(res, 'Data division berhasil diambil', division);
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const input = req.validated as UpdateDivisionInput;
      const division = await DivisionService.updateDivision(
        userId,
        requireDivisionId(req),
        input,
      );
      successResponse(res, 'Division berhasil diperbarui', division);
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      await DivisionService.deleteDivision(userId, requireDivisionId(req));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async listMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const members = await DivisionService.listDivisionMembers(
        userId,
        requireDivisionId(req),
      );
      successResponse(res, 'Anggota division berhasil diambil', members);
    } catch (error) {
      next(error);
    }
  },

  async setLeader(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const input = req.validated as SetDivisionLeaderInput;
      const result = await DivisionService.setDivisionLeader(
        userId,
        requireDivisionId(req),
        input,
      );
      successResponse(res, 'Division leader berhasil diperbarui', result);
    } catch (error) {
      next(error);
    }
  },
};
