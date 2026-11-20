import multer from 'multer';
import { ClientError } from '../exceptions/index';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
]);

/**
 * Upload satu file attachment task (spec v2 §16.1).
 * File ditampung di memori (memoryStorage); penyimpanan ke
 * Supabase Storage atau lokal `uploads/` dilakukan oleh
 * TaskAttachmentService lewat `src/utils/storage.ts`.
 */
export const uploadAttachmentFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(
        new ClientError(
          'Tipe file tidak didukung',
          400,
          'UNSUPPORTED_FILE_TYPE',
        ),
      );
      return;
    }
    cb(null, true);
  },
});
