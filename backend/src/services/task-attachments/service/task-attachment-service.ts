import { db } from '../../../../prisma/db';
import { TaskAttachmentRepository } from '../repositories/task-attachment-repository';
import type { TaskAttachmentRow } from '../repositories/task-attachment-repository';
import { TaskHistoryRepository } from '../../task-history/repositories/task-history-repository';
import { NotFoundError } from '../../../exceptions/index';
import {
  deleteStoredFile,
  storeAttachmentFile,
} from '../../../utils/storage';

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
 * Lampiran task (spec v2 §16; langkah 10).
 *
 * Penyimpanan file ditangani `src/utils/storage.ts`: bila
 * Supabase Storage dikonfigurasi (SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY + SUPABASE_STORAGE_BUCKET), file
 * diunggah ke bucket dan `fileUrl` berisi URL publiknya; bila
 * tidak, file disimpan lokal di `uploads/` dan disajikan
 * statis di `/uploads`. Metadata + respons API tetap sama
 * di kedua mode.
 */
export const TaskAttachmentService = {
  async uploadAttachment(
    userId: string,
    taskId: string,
    file: Express.Multer.File,
  ) {
    const { fileUrl } = await storeAttachmentFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      taskId,
    });
    const attachment = await db.transaction(async (tx) => {
      const created = await TaskAttachmentRepository.createAttachment(
        {
          taskId,
          uploadedBy: userId,
          fileName: file.originalname,
          fileUrl,
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
    await deleteStoredFile(attachment.fileUrl);
  },
};
