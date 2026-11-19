import multer from 'multer';
import path from 'node:path';
import { nanoid } from 'nanoid';
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

const storage = multer.diskStorage({
  destination: path.join(process.cwd(), 'uploads'),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${nanoid(12)}-${safeName}`);
  },
});

/**
 * Upload satu file attachment task (spec v2 §16.1).
 * Disimpan lokal di `uploads/` dan disajikan statis di
 * `/uploads` — pengganti sementara Supabase Storage sampai
 * bucket + kredensial Supabase disiapkan (lihat catatan di
 * TaskAttachmentService).
 */
export const uploadAttachmentFile = multer({
  storage,
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
