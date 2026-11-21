import { Router } from 'express';
import { validate } from '../../../middlewares/validate';
import { authenticateToken } from '../../../middlewares/auth';
import { DivisionController } from '../controller/division-controller';
import {
  CreateDivisionSchema,
  SetDivisionLeaderSchema,
  UpdateDivisionSchema,
} from '../validator/schema';

const router: Router = Router();

// Semua endpoint divisi butuh login. Workspace di-resolve dari
// query/body/data divisi (bukan dari path), jadi izin dicek di
// service lewat `checkWorkspacePermission`.
router.use(authenticateToken);

// GET /api/v1/divisions?workspace_id=... — workspace.view (§12.1)
router.get('/', DivisionController.list);

// POST /api/v1/divisions — workspace.manage_divisions (§12.2)
router.post('/', validate(CreateDivisionSchema), DivisionController.create);

// GET /api/v1/divisions/:id — workspace.view (§12.3)
router.get('/:id', DivisionController.detail);

// PUT /api/v1/divisions/:id — workspace.manage_divisions (§12.4)
router.put(
  '/:id',
  validate(UpdateDivisionSchema),
  DivisionController.update,
);

// DELETE /api/v1/divisions/:id — workspace.manage_divisions (§12.5)
router.delete('/:id', DivisionController.remove);

// GET /api/v1/divisions/:id/members — workspace.view (§12.6)
router.get('/:id/members', DivisionController.listMembers);

// PUT /api/v1/divisions/:id/leader — workspace.manage_divisions (§12.7)
router.put(
  '/:id/leader',
  validate(SetDivisionLeaderSchema),
  DivisionController.setLeader,
);

export default router;
