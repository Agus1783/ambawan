import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { ClientError } from '../exceptions/index';
import { errorResponse } from '../utils/response';

export default function ErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ClientError) {
    errorResponse(res, err.message, err.code, err.details, err.statusCode);
    return;
  }

  if (err instanceof ZodError) {
    const details: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.length > 0 ? issue.path.join('.') : 'body';
      details[key] = issue.message;
    }
    errorResponse(
      res,
      'Data yang dikirim tidak valid',
      'VALIDATION_ERROR',
      details,
      422,
    );
    return;
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      errorResponse(res, 'Ukuran file terlalu besar', 'FILE_TOO_LARGE', null, 400);
      return;
    }
    errorResponse(res, err.message, 'VALIDATION_ERROR', null, 400);
    return;
  }

  console.error(err);
  errorResponse(res, 'Internal Server Error', 'INTERNAL_SERVER_ERROR', null, 500);
}
