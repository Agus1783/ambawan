import { nanoid } from 'nanoid';
import type { Varchar } from '@prisma/orm-postgres/target/codec-types';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import type { Models } from '../../../../prisma/contract';
import { db } from '../../../../prisma/db';
import { varchar } from '../../../utils/varchar';

export type ProjectTemplateRow = Scalars<Models.public_ProjectTemplates>;
export type TaskTemplateRow = Scalars<Models.public_TaskTemplates>;

export type OrmClient = typeof db.orm;

export const ProjectTemplateRepository = {
  findTemplateById(id: string) {
    return db.orm.public.ProjectTemplates.where((t) =>
      t.id.eq(varchar<26>(id)),
    ).first();
  },

  findIndustryById(id: string) {
    return db.orm.public.Industries.where((i) =>
      i.id.eq(varchar<26>(id)),
    ).first();
  },

  /** Template sistem (workspace_id NULL) + kustom milik workspace. */
  async listTemplatesByWorkspace(
    workspaceId: string,
  ): Promise<ProjectTemplateRow[]> {
    const [systemTemplates, customTemplates] = await Promise.all([
      db.orm.public.ProjectTemplates.where((t) => t.workspaceId.isNull())
        .orderBy((t) => t.createdAt.asc())
        .all(),
      db.orm.public.ProjectTemplates.where((t) =>
        t.workspaceId.eq(varchar<26>(workspaceId)),
      )
        .orderBy((t) => t.createdAt.asc())
        .all(),
    ]);
    return [...systemTemplates, ...customTemplates];
  },

  createTemplate(
    data: {
      workspaceId: string;
      industryId: string | null;
      name: string;
      description: string | null;
      createdBy: string;
    },
    orm: OrmClient = db.orm,
  ) {
    return orm.public.ProjectTemplates.create({
      id: varchar<26>(nanoid()),
      industryId:
        data.industryId === null ? null : varchar<26>(data.industryId),
      workspaceId: varchar<26>(data.workspaceId),
      name: varchar<150>(data.name),
      description: data.description,
      createdBy: varchar<26>(data.createdBy),
    });
  },

  updateTemplate(
    id: string,
    data: {
      name?: string | undefined;
      description?: string | undefined;
      industryId?: string | null | undefined;
    },
    orm: OrmClient = db.orm,
  ) {
    const updateData: {
      name?: Varchar<150>;
      description?: string | null;
      industryId?: Varchar<26> | null;
    } = {};
    if (data.name !== undefined) {
      updateData.name = varchar<150>(data.name);
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.industryId !== undefined) {
      updateData.industryId =
        data.industryId === null ? null : varchar<26>(data.industryId);
    }
    return orm.public.ProjectTemplates.where((t) =>
      t.id.eq(varchar<26>(id)),
    ).update(updateData);
  },

  deleteTemplate(id: string, orm: OrmClient = db.orm) {
    return orm.public.ProjectTemplates.where((t) =>
      t.id.eq(varchar<26>(id)),
    ).delete();
  },

  findTaskTemplateById(id: string) {
    return db.orm.public.TaskTemplates.where((t) =>
      t.id.eq(varchar<26>(id)),
    ).first();
  },

  async listTaskTemplatesByTemplateId(
    templateId: string,
  ): Promise<TaskTemplateRow[]> {
    const rows = await db.orm.public.TaskTemplates.where((t) =>
      t.projectTemplateId.eq(varchar<26>(templateId)),
    )
      .orderBy((t) => t.sortOrder.asc())
      .all();
    return rows;
  },

  createTaskTemplate(
    data: {
      projectTemplateId: string;
      parentTemplateId: string | null;
      title: string;
      description: string | null;
      priority: string;
      sortOrder: number;
    },
    orm: OrmClient = db.orm,
  ) {
    return orm.public.TaskTemplates.create({
      id: varchar<26>(nanoid()),
      projectTemplateId: varchar<26>(data.projectTemplateId),
      parentTemplateId:
        data.parentTemplateId === null
          ? null
          : varchar<26>(data.parentTemplateId),
      title: varchar<200>(data.title),
      description: data.description,
      priority: varchar<10>(data.priority),
      sortOrder: data.sortOrder,
    });
  },

  updateTaskTemplate(
    id: string,
    data: {
      title?: string | undefined;
      description?: string | undefined;
      priority?: string | undefined;
      parentTemplateId?: string | null | undefined;
      sortOrder?: number | undefined;
    },
    orm: OrmClient = db.orm,
  ) {
    const updateData: {
      title?: Varchar<200>;
      description?: string | null;
      priority?: Varchar<10>;
      parentTemplateId?: Varchar<26> | null;
      sortOrder?: number;
    } = {};
    if (data.title !== undefined) {
      updateData.title = varchar<200>(data.title);
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.priority !== undefined) {
      updateData.priority = varchar<10>(data.priority);
    }
    if (data.parentTemplateId !== undefined) {
      updateData.parentTemplateId =
        data.parentTemplateId === null
          ? null
          : varchar<26>(data.parentTemplateId);
    }
    if (data.sortOrder !== undefined) {
      updateData.sortOrder = data.sortOrder;
    }
    return orm.public.TaskTemplates.where((t) =>
      t.id.eq(varchar<26>(id)),
    ).update(updateData);
  },

  deleteTaskTemplate(id: string, orm: OrmClient = db.orm) {
    return orm.public.TaskTemplates.where((t) =>
      t.id.eq(varchar<26>(id)),
    ).delete();
  },
};
