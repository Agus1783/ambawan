import type { Response } from 'express';
import type { PaginationMeta } from './pagination';

export function successResponse(
  res: Response,
  message: string,
  data: unknown = null,
  code = 200,
  pagination: PaginationMeta | null = null,
): Response {
  const body: Record<string, unknown> = { success: true, message, data };
  if (pagination) {
    body.pagination = pagination;
  }
  return res.status(code).json(body);
}

export function errorResponse(
  res: Response,
  message: string,
  code: string,
  details: unknown = null,
  statusCode = 400
): Response {
  return res
    .status(statusCode)
    .json({ success: false, message, error: { code, details } });
}
