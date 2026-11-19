import { Router } from 'express';
import type { Request, Response } from 'express';
import { successResponse } from '../utils/response';
import { authenticateToken } from '../middlewares/auth';
import authRoutes from '../services/authentications/routes/index';
import workspaceRoutes from '../services/workspaces/routes/index';
import industryRoutes from '../services/industries/routes/index';
import invitationRoutes from '../services/invitations/routes/index';
import divisionRoutes from '../services/divisions/routes/index';
import projectRoutes from '../services/projects/routes/index';
import taskRoutes from '../services/tasks/routes/index';
import { RoleController } from '../services/roles/controller/role-controller';

const router: Router = Router();

// Health check: GET /api/v1/health
router.get('/health', (_req: Request, res: Response): void => {
  successResponse(res, 'OK');
});

router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/industries', industryRoutes);
router.use('/invitations', invitationRoutes);
router.use('/divisions', divisionRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);

// Katalog izin sistem (spec §10.1).
router.get(
  '/permissions',
  authenticateToken,
  RoleController.getPermissionCatalog,
);

export default router;
