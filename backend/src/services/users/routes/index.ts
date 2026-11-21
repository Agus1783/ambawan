import { Router } from 'express';
import { authenticateToken } from '../../../middlewares/auth';
import { UserController } from '../controller/user-controller';

const router: Router = Router();

// Semua endpoint users butuh login.
router.use(authenticateToken);

// GET /api/v1/users/:id — member.view di workspace bersama (§7.1)
router.get('/:id', UserController.detail);

export default router;
