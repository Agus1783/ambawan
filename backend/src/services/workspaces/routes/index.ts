import { Router } from 'express';
import { validate } from '../../../middlewares/validate';
import { authenticateToken } from '../../../middlewares/auth';
import { authorize } from '../../../middlewares/authorize';
import {
  CreateWorkspaceSchema,
  UpdateMemberRoleSchema,
  UpdateWorkspaceSchema,
} from '../validator/schema';
import { WorkspaceController } from '../controller/workspace-controller';
import { InvitationController } from '../../invitations/controller/invitation-controller';
import { CreateInvitationSchema } from '../../invitations/validator/schema';
import roleRoutes from '../../roles/routes/index';

const router: Router = Router();

// Semua endpoint workspace butuh login.
router.use(authenticateToken);

// POST /api/v1/workspaces — tanpa izin khusus (batas satu workspace
// ditegakkan service, spec §8.1).
router.post('/', validate(CreateWorkspaceSchema), WorkspaceController.create);

// GET /api/v1/workspaces — workspace yang diikuti user.
router.get('/', WorkspaceController.listMine);

// GET /api/v1/workspaces/:id — workspace.view
router.get('/:id', authorize('workspace.view'), WorkspaceController.detail);

// PUT /api/v1/workspaces/:id — workspace.update
router.put(
  '/:id',
  authorize('workspace.update'),
  validate(UpdateWorkspaceSchema),
  WorkspaceController.update,
);

// DELETE /api/v1/workspaces/:id — workspace.delete
router.delete('/:id', authorize('workspace.delete'), WorkspaceController.remove);

// GET /api/v1/workspaces/:id/members — member.view
router.get(
  '/:id/members',
  authorize('member.view'),
  WorkspaceController.listMembers,
);

// PUT /api/v1/workspaces/:id/members/:userId/role — member.manage
router.put(
  '/:id/members/:userId/role',
  authorize('member.manage'),
  validate(UpdateMemberRoleSchema),
  WorkspaceController.updateMemberRole,
);

// DELETE /api/v1/workspaces/:id/members/:userId — member.manage
router.delete(
  '/:id/members/:userId',
  authorize('member.manage'),
  WorkspaceController.removeMember,
);

// POST /api/v1/workspaces/:id/invitations — member.invite (spec §11.1)
router.post(
  '/:id/invitations',
  authorize('member.invite'),
  validate(CreateInvitationSchema),
  InvitationController.create,
);

// GET /api/v1/workspaces/:id/invitations — member.view (spec §11.2)
router.get(
  '/:id/invitations',
  authorize('member.view'),
  InvitationController.list,
);

// Role kustom: /api/v1/workspaces/:id/roles (spec §10).
router.use('/:id/roles', roleRoutes);

export default router;
