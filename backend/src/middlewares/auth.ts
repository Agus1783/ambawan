import type { NextFunction, Request, Response } from 'express';
import { TokenManager } from '../utils/token-manager';
import { AuthenticationError } from '../exceptions/index';


export function authenticateToken(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AuthenticationError('Unauthorized'));
    return;
  }

  const token = authHeader.slice('Bearer '.length);
  if (!token) {
    next(new AuthenticationError('Unauthorized'));
    return;
  }

  try {
    const payload = TokenManager.verifyAccessToken(token);
    req.user = { id: payload.sub };
    next();
  } catch (error) {
    next(error);
  }
}

export default authenticateToken;
