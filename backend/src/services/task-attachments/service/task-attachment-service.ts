import fs from 'node:fs/promises';
import path from 'node:path';
import { db } from '../../../../prisma/db';
import { TaskAttachmentRepository } from '../repositories/task-attachment-repository';
import type { TaskAttachmentRow } from '../repositories/task-attachment-repository';
import { TaskHistoryRepository } from '../../task-history/repositories/task-history-repository';
import { NotFoundError } from '../../../exceptions/index';

function toAttachment(row: TaskAttachmentRow) {
  return {
    id: row.id,
    fileName: row.fileName,
    fileType: row.fileType,
    // file_size disimpan BigInt di DB; JSON tidak bisa
    // membawa bigint, jadi dikembalikan sebagai number.
    fileSize: row.fileSize === null ? null : Number(row.fileSize),
    fileUrl: row.fileUrl,
  };
}

/**
 * Lampiran task (spec v2 §16).
 *
 * CATATAN PENYIMPANAN: spec menulis "upload file ke Supabase
 * Storage", tetapi backend ini belum punya kredensial Supabase
 * Storage (tidak ada @supabase/supabase-js maupun
 * SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY di .env). Supaya
 * endpoint tetap berfungsi end-to-end di MVP, file disimpan
 * lokal di `uploads/` (multer) dan disajikan statis di
 * `/uploads`. Bila nanti Supabase Storage disiapkan, yang
 * berubah hanya fungsi upload di service ini (dan
 * `fileUrl` menjadi URL publik Supabase); metadata +
 * respons API tetap sama.
 */
export const TaskAttachmentService = {
  async uploadAttachment(
    userId: string,
    taskId: string,
    file: Express.Multer.File,
  ) {
    const attachment = await db.transaction(async (tx) => {
      const created = await TaskAttachmentRepository.createAttachment(
        {
          taskId,
          uploadedBy: userId,
          fileName: file.originalname,
          fileUrl: `/uploads/${file.filename}`,
          fileType: file.mimetype,
          fileSize: file.size,
        },
        tx.orm,
      );
      await TaskHistoryRepository.createHistory(
        {
          taskId,
          userId,
          action: 'ATTACHMENT_ADDED',
          description: `Attachment "${file.originalname}" ditambahkan`,
        },
        tx.orm,
      );
      return created;
    });
    return toAttachment(attachment);
  },

  async listAttachments(taskId: string) {
    const rows = await TaskAttachmentRepository.listByTask(taskId);
    return rows.map(toAttachment);
  },

  async deleteAttachment(
    userId: string,
    taskId: string,
    attachmentId: string,
  ) {
    const attachment = await TaskAttachmentRepository.findByTaskAndId(
      taskId,
      attachmentId,
    );
    if (!attachment) {
      throw new NotFoundError(
        'Attachment tidak ditemukan',
        'ATTACHMENT_NOT_FOUND',
      );
    }

    await db.transaction(async (tx) => {
      await TaskAttachmentRepository.deleteAttachment(attachment.id, tx.orm);
      await TaskHistoryRepository.createHistory(
        {
          taskId,
          userId,
          action: 'ATTACHMENT_DELETED',
          description: `Attachment "${attachment.fileName}" dihapus`,
        },
        tx.orm,
      );
    });

    // Hapus file fisik (best-effort; abaikan bila sudah tidak ada).
    const fileName = path.basename(attachment.fileUrl);
    await fs
      .unlink(path.join(process.cwd(), 'uploads', fileName))
      .catch(() => undefined);
  },
};
