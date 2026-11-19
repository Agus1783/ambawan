import type { NextFunction, Request, Response } from 'express';
import { IndustryService } from '../service/industry-service';
import { AuthenticationError } from '../../../exceptions/index';
import { paramValue } from '../../../middlewares/authorize';
import { successResponse } from '../../../utils/response';
import { parsePagination } from '../../../utils/pagination';
import type { CreateIndustryInput } from '../validator/schema';

/**
 * Controller industri (spec v2 §9).
 */
export const IndustryController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query);
      const search =
        typeof req.query.search === 'string' ? req.query.search : undefined;
      const result = await IndustryService.listIndustries({
        ...pagination,
        search,
      });
      successResponse(
        res,
        'Data bidang usaha berhasil diambil',
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
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthenticationError('Unauthorized');
      }
      const input = req.validated as CreateIndustryInput;
      const industry = await IndustryService.createIndustry(userId, input);
      successResponse(res, 'Bidang usaha berhasil ditambahkan', industry, 201);
    } catch (error) {
      next(error);
    }
  },

  async suggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const industryId = paramValue(req, 'id');
      if (!industryId) {
        throw new AuthenticationError('Unauthorized');
      }
      const items =
        await IndustryService.getProjectSuggestions(industryId);
      successResponse(res, 'Saran proyek berhasil diambil', items);
    } catch (error) {
      next(error);
    }
  },
};
