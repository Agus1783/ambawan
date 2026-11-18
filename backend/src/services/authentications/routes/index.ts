import { Router } from 'express';
import { validate } from '../../../middlewares/validate';
import { authenticateToken } from '../../../middlewares/auth';
import {
  GoogleSchema,
  LoginSchema,
  RegisterSchema,
} from '../validator/schema';
import { AuthenticationController } from '../controller/auth-controller';

const router: Router = Router();

// POST /api/v1/auth/register — tanpa auth
router.post(
  '/register',
  validate(RegisterSchema),
  AuthenticationController.register,
);

// POST /api/v1/auth/login — tanpa auth
router.post('/login', validate(LoginSchema), AuthenticationController.login);

// POST /api/v1/auth/logout — butuh auth (stateless, lihat controller)
router.post('/logout', authenticateToken, AuthenticationController.logout);

// GET /api/v1/auth/me — butuh auth
router.get('/me', authenticateToken, AuthenticationController.me);

// POST /api/v1/auth/google — tanpa auth
router.post(
  '/google',
  validate(GoogleSchema),
  AuthenticationController.google,
);

export default router;
