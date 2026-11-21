import { Router } from 'express';
import { validate } from '../../../middlewares/validate';
import { authenticateToken } from '../../../middlewares/auth';
import { authorize } from '../../../middlewares/authorize';
import { CreateRoleSchema, UpdateRoleSchema } from '../validator/schema';
import { RoleController } from '../controller/role-controller';

// mergeParams: true — agar `:id` (workspace) dari router induk
// `/workspaces/:id/roles` terbaca di sini (dipakai authorize).
const router: Router = Router({ mergeParams: true });

// Semua endpoint role butuh login.
router.use(authenticateToken);

// GET /api/v1/workspaces/:id/roles — member.view
router.get('/', authorize('member.view'), RoleController.list);

// POST /api/v1/workspaces/:id/roles — member.manage
router.post(
  '/',
  authorize('member.manage'),
  validate(CreateRoleSchema),
  RoleController.create,
);

// GET /api/v1/workspaces/:id/roles/:roleId — member.view
router.get('/:roleId', authorize('member.view'), RoleController.detail);

// PUT /api/v1/workspaces/:id/roles/:roleId — member.manage
router.put(
  '/:roleId',
  authorize('member.manage'),
  validate(UpdateRoleSchema),
  RoleController.update,
);

// DELETE /api/v1/workspaces/:id/roles/:roleId — member.manage
router.delete('/:roleId', authorize('member.manage'), RoleController.remove);

export default router;
