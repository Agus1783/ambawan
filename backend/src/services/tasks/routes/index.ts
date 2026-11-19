import { Router } from 'express';
import { validate } from '../../../middlewares/validate';
import { authenticateToken } from '../../../middlewares/auth';
import { authorizeTask } from '../../../middlewares/authorize-task';
import { uploadAttachmentFile } from '../../../middlewares/upload';
import { TaskController } from '../controller/task-controller';
import { TaskHistoryController } from '../../task-history/controller/task-history-controller';
import { TaskAttachmentController } from '../../task-attachments/controller/task-attachment-controller';
import { TaskCommentController } from '../../task-comments/controller/task-comment-controller';
import {
  CreateTaskSchema,
  DelegateTaskSchema,
  UpdateTaskSchema,
  UpdateTaskStatusSchema,
} from '../validator/schema';
import { CreateCommentSchema } from '../../task-comments/validator/schema';

const router: Router = Router();

// Semua endpoint task butuh login.
router.use(authenticateToken);

// GET /api/v1/tasks?workspace_id=... — task.view (§14.1)
router.get('/', TaskController.list);

// POST /api/v1/tasks — task.create (§14.2)
router.post('/', validate(CreateTaskSchema), TaskController.create);

// GET /api/v1/tasks/:id — task.view sesuai scope (§14.3)
router.get('/:id', authorizeTask('task.view'), TaskController.detail);

// PUT /api/v1/tasks/:id — task.update sesuai scope (§14.4)
router.put(
  '/:id',
  authorizeTask('task.update'),
  validate(UpdateTaskSchema),
  TaskController.update,
);

// DELETE /api/v1/tasks/:id — task.delete sesuai scope (§14.5)
router.delete('/:id', authorizeTask('task.delete'), TaskController.remove);

// PUT /api/v1/tasks/:id/status — task.update_status (§14.6)
router.put(
  '/:id/status',
  authorizeTask('task.update_status'),
  validate(UpdateTaskStatusSchema),
  TaskController.updateStatus,
);

// POST /api/v1/tasks/:id/delegate — task.delegate (§14.7)
router.post(
  '/:id/delegate',
  authorizeTask('task.delegate'),
  validate(DelegateTaskSchema),
  TaskController.delegate,
);

// GET /api/v1/tasks/:id/subtasks — task.view (§14.8)
router.get('/:id/subtasks', authorizeTask('task.view'), TaskController.listSubtasks);

// GET /api/v1/tasks/:id/history — history.view (§15.1)
router.get(
  '/:id/history',
  authorizeTask('history.view'),
  TaskHistoryController.list,
);

// POST /api/v1/tasks/:id/attachments — attachment.upload (§16.1).
// authorizeTask dulu (sebelum multer) supaya request tanpa izin
// tidak sempat mengunggah file.
router.post(
  '/:id/attachments',
  authorizeTask('attachment.upload'),
  uploadAttachmentFile.single('file'),
  TaskAttachmentController.upload,
);

// GET /api/v1/tasks/:id/attachments — task.view (§16.2)
router.get(
  '/:id/attachments',
  authorizeTask('task.view'),
  TaskAttachmentController.list,
);

// DELETE /api/v1/tasks/:taskId/attachments/:attachmentId —
// attachment.delete (§16.3)
router.delete(
  '/:taskId/attachments/:attachmentId',
  authorizeTask('attachment.delete', 'taskId'),
  TaskAttachmentController.remove,
);

// POST /api/v1/tasks/:id/comments — comment.create (§17.1)
router.post(
  '/:id/comments',
  authorizeTask('comment.create'),
  validate(CreateCommentSchema),
  TaskCommentController.create,
);

// GET /api/v1/tasks/:id/comments — task.view (§17.2)
router.get(
  '/:id/comments',
  authorizeTask('task.view'),
  TaskCommentController.list,
);

// DELETE /api/v1/tasks/:taskId/comments/:commentId — penulis
// komentar atau pemilik izin task.delete (§17.3). Izin dicek
// di service (bukan middleware) karena ada dua jalur.
router.delete(
  '/:taskId/comments/:commentId',
  TaskCommentController.remove,
);

export default router;
