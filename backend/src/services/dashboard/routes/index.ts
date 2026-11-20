import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth';
import { DashboardController } from '../controller/dashboard-controller';

const router: Router = Router();

// Semua endpoint dashboard butuh login.
router.use(authenticateToken);

// GET /api/v1/dashboard/summary?workspace_id=... — dashboard.view (§18.1)
router.get('/summary', DashboardController.summary);

// GET /api/v1/dashboard/tasks?workspace_id=... — analytics.view (§18.2)
router.get('/tasks', DashboardController.taskStatistics);

export default router;
