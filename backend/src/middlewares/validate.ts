import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';
import { ClientError } from '../exceptions/index';


export function validate(schema: z.ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.length > 0 ? issue.path.join('.') : 'body';
        details[key] = issue.message;
      }
      next(
        new ClientError(
          'Data yang dikirim tidak valid',
          422,
          'VALIDATION_ERROR',
          details,
        ),
      );
      return;
    }
    req.validated = result.data;
    next();
  };
}

export default validate;
