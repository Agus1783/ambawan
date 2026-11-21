import { Router } from 'express';
import { validate } from '../../../middlewares/validate';
import { authenticateToken } from '../../../middlewares/auth';
import { authorize } from '../../../middlewares/authorize';
import { ProjectTemplateController } from '../controller/project-template-controller';
import {
  CreateProjectTemplateSchema,
  CreateTaskTemplateSchema,
  UpdateProjectTemplateSchema,
  UpdateTaskTemplateSchema,
} from '../validator/schema';

// mergeParams: true agar :id dari parent
// (/workspaces/:id/project-templates) terbaca di sini.
const router: Router = Router({ mergeParams: true });

// Semua endpoint template butuh login; izin per-workspace
// dicek `authorize` dengan param 'id' (workspace).
router.use(authenticateToken);

// GET /api/v1/workspaces/:id/project-templates — workspace.view
// (§13.8)
router.get(
  '/',
  authorize('workspace.view'),
  ProjectTemplateController.list,
);

// POST /api/v1/workspaces/:id/project-templates —
// workspace.manage_templates (§13.9)
router.post(
  '/',
  authorize('workspace.manage_templates'),
  validate(CreateProjectTemplateSchema),
  ProjectTemplateController.create,
);

// GET /api/v1/workspaces/:id/project-templates/:templateId —
// workspace.view (§13.10)
router.get(
  '/:templateId',
  authorize('workspace.view'),
  ProjectTemplateController.detail,
);

// PUT /api/v1/workspaces/:id/project-templates/:templateId —
// workspace.manage_templates (§13.11)
router.put(
  '/:templateId',
  authorize('workspace.manage_templates'),
  validate(UpdateProjectTemplateSchema),
  ProjectTemplateController.update,
);

// DELETE /api/v1/workspaces/:id/project-templates/:templateId —
// workspace.manage_templates (§13.12)
router.delete(
  '/:templateId',
  authorize('workspace.manage_templates'),
  ProjectTemplateController.remove,
);

// GET /api/v1/workspaces/:id/project-templates/:templateId/tasks —
// workspace.view (§13.13)
router.get(
  '/:templateId/tasks',
  authorize('workspace.view'),
  ProjectTemplateController.listTasks,
);

// POST .../tasks — workspace.manage_templates (§13.14)
router.post(
  '/:templateId/tasks',
  authorize('workspace.manage_templates'),
  validate(CreateTaskTemplateSchema),
  ProjectTemplateController.createTask,
);

// PUT .../tasks/:taskTemplateId — workspace.manage_templates (§13.15)
router.put(
  '/:templateId/tasks/:taskTemplateId',
  authorize('workspace.manage_templates'),
  validate(UpdateTaskTemplateSchema),
  ProjectTemplateController.updateTask,
);

// DELETE .../tasks/:taskTemplateId — workspace.manage_templates
// (§13.16)
router.delete(
  '/:templateId/tasks/:taskTemplateId',
  authorize('workspace.manage_templates'),
  ProjectTemplateController.removeTask,
);

export default router;
