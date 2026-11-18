import type { NextFunction, Request, Response } from 'express';
import { AuthenticationService } from '../service/auth-service';
import { AuthenticationError } from '../../../exceptions/index';
import { successResponse } from '../../../utils/response';
import type {
  GoogleInput,
  LoginInput,
  RegisterInput,
} from '../validator/schema';

/**
 * Controller auth (spec v2 §6). Hanya menerjemahkan HTTP <-> service:
 * ambil `req.validated` (hasil Zod), panggil service, kirim envelope.
 */
export const AuthenticationController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.validated as RegisterInput;
      const user = await AuthenticationService.register(input);
      successResponse(res, 'Registrasi berhasil', user, 201);
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.validated as LoginInput;
      const result = await AuthenticationService.login(input);
      successResponse(res, 'Login berhasil', result);
    } catch (error) {
      next(error);
    }
  },

  logout(_req: Request, res: Response) {
    // JWT stateless (spec §6.3): tidak ada yang dihapus di server.
    // Client cukup membuang access token-nya.
    successResponse(res, 'Logout berhasil');
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthenticationError('Unauthorized');
      }
      const user = await AuthenticationService.getMe(userId);
      successResponse(res, 'Data user berhasil diambil', user);
    } catch (error) {
      next(error);
    }
  },

  async google(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.validated as GoogleInput;
      const result = await AuthenticationService.loginWithGoogle(input);
      successResponse(
        res,
        'Login dengan Google berhasil',
        { user: result.user, accessToken: result.accessToken },
        result.isNewUser ? 201 : 200,
      );
    } catch (error) {
      next(error);
    }
  },
};
