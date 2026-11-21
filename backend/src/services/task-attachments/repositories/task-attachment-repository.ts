import { nanoid } from 'nanoid';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import type { Models } from '../../../../prisma/contract';
import { db } from '../../../../prisma/db';
import { varchar } from '../../../utils/varchar';

export type TaskAttachmentRow = Scalars<Models.public_TaskAttachments>;

export type OrmClient = typeof db.orm;

export const TaskAttachmentRepository = {
  findById(id: string) {
    return db.orm.public.TaskAttachments.where((a) =>
      a.id.eq(varchar<26>(id)),
    ).first();
  },

  findByTaskAndId(taskId: string, attachmentId: string) {
    return db.orm.public.TaskAttachments.where((a) =>
      a.taskId.eq(varchar<26>(taskId)),
    )
      .where((a) => a.id.eq(varchar<26>(attachmentId)))
      .first();
  },

  async listByTask(taskId: string): Promise<TaskAttachmentRow[]> {
    const rows = await db.orm.public.TaskAttachments.where((a) =>
      a.taskId.eq(varchar<26>(taskId)),
    )
      .orderBy((a) => a.createdAt.asc())
      .all();
    return rows;
  },

  createAttachment(
    data: {
      taskId: string;
      uploadedBy: string;
      fileName: string;
      fileUrl: string;
      fileType: string | null;
      fileSize: number | null;
    },
    orm: OrmClient = db.orm,
  ) {
    return orm.public.TaskAttachments.create({
      id: varchar<26>(nanoid()),
      taskId: varchar<26>(data.taskId),
      uploadedBy: varchar<26>(data.uploadedBy),
      fileName: varchar<255>(data.fileName),
      fileUrl: data.fileUrl,
      fileType:
        data.fileType === null ? null : varchar<100>(data.fileType),
      fileSize: data.fileSize === null ? null : BigInt(data.fileSize),
    });
  },

  deleteAttachment(id: string, orm: OrmClient = db.orm) {
    return orm.public.TaskAttachments.where((a) =>
      a.id.eq(varchar<26>(id)),
    ).delete();
  },
};
