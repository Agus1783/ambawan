import type { Response } from 'express';

export function successResponse(
  res: Response,
  message: string,
  data: unknown = null,
  code = 200
): Response {
  return res.status(code).json({ success: true, message, data });
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
