import { Router } from 'express';
import { validate } from '../../../middlewares/validate';
import { authenticateToken } from '../../../middlewares/auth';
import { authorizeProject } from '../../../middlewares/authorize-project';
import { ProjectController } from '../controller/project-controller';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
} from '../validator/schema';

const router: Router = Router();

// Semua endpoint project butuh login.
router.use(authenticateToken);

// GET /api/v1/projects?workspace_id=... — project.view (§13.1)
router.get('/', ProjectController.list);

// POST /api/v1/projects — project.create (§13.2)
router.post('/', validate(CreateProjectSchema), ProjectController.create);

// GET /api/v1/projects/templates/:templateId/tasks — workspace.view
// (§13.6). HARUS di atas `/:id`: kalau tidak, "templates"
// ditangkap sebagai :id.
router.get(
  '/templates/:templateId/tasks',
  ProjectController.templateTasksPreview,
);

// GET /api/v1/projects/:id — project.view via authorizeProject
// (§13.3). Anggota proyek saja (bukan anggota workspace)
// juga boleh melihat detail project ini.
router.get('/:id', authorizeProject('project.view'), ProjectController.detail);

// PUT /api/v1/projects/:id — project.update (§13.4)
router.put(
  '/:id',
  authorizeProject('project.update'),
  validate(UpdateProjectSchema),
  ProjectController.update,
);

// DELETE /api/v1/projects/:id — project.delete (§13.5)
router.delete('/:id', authorizeProject('project.delete'), ProjectController.remove);

// GET /api/v1/projects/:id/members — member.view (§13.7).
// Izin dicek terhadap workspace pemilik project di service
// (spec: pemanggil harus anggota workspace).
router.get('/:id/members', ProjectController.listMembers);

export default router;
