import { Router } from 'express';
import type { Request, Response } from 'express';
import { successResponse } from '../utils/response';

const router: Router = Router();

// Health check: GET /api/v1/health
router.get('/health', (_req: Request, res: Response): void => {
  successResponse(res, 'OK');
});

// Router fitur didaftarkan di sini pada langkah berikutnya, contoh:
// import authRoutes from '../services/authentications/routes/index';
// router.use('/auth', authRoutes);

export default router;
