import { Router } from 'express';
import type { Request, Response } from 'express';
import { successResponse } from '../utils/response';
import authRoutes from '../services/authentications/routes/index';

const router: Router = Router();

// Health check: GET /api/v1/health
router.get('/health', (_req: Request, res: Response): void => {
  successResponse(res, 'OK');
});

router.use('/auth', authRoutes);

export default router;
