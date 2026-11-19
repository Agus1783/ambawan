import type { NextFunction, Request, Response } from 'express';
import { TaskAttachmentService } from '../service/task-attachment-service';
import {
  AuthenticationError,
  ClientError,
} from '../../../exceptions/index';
import { paramValue } from '../../../middlewares/authorize';
import { successResponse } from '../../../utils/response';

function requireUserId(req: Request): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new AuthenticationError('Unauthorized');
  }
  return userId;
}

/** Controller lampiran task (spec v2 §16). */
export const TaskAttachmentController = {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const taskId = paramValue(req, 'id');
      if (!taskId) {
        throw new AuthenticationError('Unauthorized');
      }
      if (!req.file) {
        throw new ClientError('File wajib diisi', 400, 'VALIDATION_ERROR', {
          file: 'File wajib diisi',
        });
      }
      const attachment = await TaskAttachmentService.uploadAttachment(
        userId,
        taskId,
        req.file,
      );
      successResponse(res, 'Attachment berhasil diupload', attachment, 201);
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = paramValue(req, 'id');
      if (!taskId) {
        throw new AuthenticationError('Unauthorized');
      }
      const attachments =
        await TaskAttachmentService.listAttachments(taskId);
      successResponse(res, 'Attachment berhasil diambil', attachments);
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const taskId = paramValue(req, 'taskId');
      const attachmentId = paramValue(req, 'attachmentId');
      if (!taskId || !attachmentId) {
        throw new AuthenticationError('Unauthorized');
      }
      await TaskAttachmentService.deleteAttachment(
        userId,
        taskId,
        attachmentId,
      );
      successResponse(res, 'Attachment berhasil dihapus', null);
    } catch (error) {
      next(error);
    }
  },
};
