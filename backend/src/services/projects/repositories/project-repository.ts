import { nanoid } from 'nanoid';
import { and, or } from '@prisma/orm-postgres/orm-client';
import type { TimestamptzString } from '@prisma/orm-postgres/target/codec-types';
import type { Varchar } from '@prisma/orm-postgres/target/codec-types';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import type { Models } from '../../../../prisma/contract';
import { db } from '../../../../prisma/db';
import { varchar } from '../../../utils/varchar';
import { timestamptz } from '../../invitations/repositories/invitation-repository';

export type ProjectRow = Scalars<Models.public_Projects>;
export type ProjectUserRow = Scalars<Models.public_Users>;
export type ProjectRoleRow = Scalars<Models.public_WorkspaceRoles>;
export type ProjectMembershipRow =
  Scalars<Models.public_WorkspaceMemberships>;
export type ProjectMemberRow = Scalars<Models.public_ProjectMembers>;
export type ProjectTaskRow = Scalars<Models.public_Tasks>;
export type ProjectTaskTemplateRow = Scalars<Models.public_TaskTemplates>;

export type OrmClient = typeof db.orm;

function projectsFiltered(
  workspaceId: string,
  opts: { search?: string | undefined },
) {
  return db.orm.public.Projects.where((p) => {
    const preds = [p.workspaceId.eq(varchar<26>(workspaceId))];
    if (opts.search) {
      const pattern = `%${opts.search.replace(/[%_\\]/g, '\\$&')}%`;
      // Cari di nama ATAU deskripsi.
      preds.push(or(p.name.ilike(pattern), p.description.ilike(pattern)));
    }
    return and(...preds);
  });
}

export const ProjectRepository = {
  findById(id: string) {
    return db.orm.public.Projects.where((p) =>
      p.id.eq(varchar<26>(id)),
    ).first();
  },

  findWorkspaceById(id: string) {
    return db.orm.public.Workspaces.where((w) =>
      w.id.eq(varchar<26>(id)),
    ).first();
  },

  findIndustryById(id: string) {
    return db.orm.public.Industries.where((i) =>
      i.id.eq(varchar<26>(id)),
    ).first();
  },

  findTemplateById(id: string) {
    return db.orm.public.ProjectTemplates.where((t) =>
      t.id.eq(varchar<26>(id)),
    ).first();
  },

  findUserById(id: string) {
    return db.orm.public.Users.where((u) =>
      u.id.eq(varchar<26>(id)),
    ).first();
  },

  async findUsersByIds(ids: string[]): Promise<ProjectUserRow[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await db.orm.public.Users.where((u) =>
      u.id.in(ids.map((id) => varchar<26>(id))),
    ).all();
    return rows;
  },

  findMembership(workspaceId: string, userId: string) {
    return db.orm.public.WorkspaceMemberships.where((m) =>
      m.workspaceId.eq(varchar<26>(workspaceId)),
    )
      .where((m) => m.userId.eq(varchar<26>(userId)))
      .first();
  },

  async findRolesByIds(ids: string[]): Promise<ProjectRoleRow[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await db.orm.public.WorkspaceRoles.where((r) =>
      r.id.in(ids.map((id) => varchar<26>(id))),
    ).all();
    return rows;
  },

  async findProjectMembersByProject(
    projectId: string,
  ): Promise<ProjectMemberRow[]> {
    const rows = await db.orm.public.ProjectMembers.where((m) =>
      m.projectId.eq(varchar<26>(projectId)),
    ).all();
    return rows;
  },

  async listProjects(
    workspaceId: string,
    opts: { search?: string | undefined; limit: number; offset: number },
  ): Promise<ProjectRow[]> {
    const rows = await projectsFiltered(workspaceId, opts)
      .orderBy((p) => p.createdAt.asc())
      .limit(opts.limit)
      .offset(opts.offset)
      .all();
    return rows;
  },

  async countProjects(
    workspaceId: string,
    opts: { search?: string | undefined },
  ): Promise<number> {
    const result = await projectsFiltered(workspaceId, opts).aggregate(
      (a) => ({ total: a.count() }),
    );
    return result.total;
  },

  createProject(
    data: {
      workspaceId: string;
      name: string;
      description: string | null;
      deadline: string | null;
      ownerId: string;
      industryId: string | null;
      projectTemplateId: string | null;
    },
    orm: OrmClient = db.orm,
  ) {
    return orm.public.Projects.create({
      id: varchar<26>(nanoid()),
      workspaceId: varchar<26>(data.workspaceId),
      name: varchar<150>(data.name),
      description: data.description,
      deadline:
        data.deadline === null ? null : timestamptz(data.deadline),
      ownerId: varchar<26>(data.ownerId),
      industryId:
        data.industryId === null ? null : varchar<26>(data.industryId),
      projectTemplateId:
        data.projectTemplateId === null
          ? null
          : varchar<26>(data.projectTemplateId),
    });
  },

  updateProject(
    id: string,
    data: {
      name?: string | undefined;
      description?: string | undefined;
      deadline?: string | undefined;
    },
    orm: OrmClient = db.orm,
  ) {
    const updateData: {
      name?: Varchar<150>;
      description?: string | null;
      deadline?: TimestamptzString | null;
    } = {};
    if (data.name !== undefined) {
      updateData.name = varchar<150>(data.name);
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.deadline !== undefined) {
      updateData.deadline = timestamptz(data.deadline);
    }
    return orm.public.Projects.where((p) =>
      p.id.eq(varchar<26>(id)),
    ).update(updateData);
  },

  deleteProject(id: string, orm: OrmClient = db.orm) {
    return orm.public.Projects.where((p) =>
      p.id.eq(varchar<26>(id)),
    ).delete();
  },

  async countTasksByProject(projectId: string): Promise<number> {
    const result = await db.orm.public.Tasks.where((t) =>
      t.projectId.eq(varchar<26>(projectId)),
    ).aggregate((a) => ({ total: a.count() }));
    return result.total;
  },

  async countCompletedTasksByProject(projectId: string): Promise<number> {
    const result = await db.orm.public.Tasks.where((t) =>
      t.projectId.eq(varchar<26>(projectId)),
    )
      .where((t) => t.status.eq(varchar<30>('COMPLETED')))
      .aggregate((a) => ({ total: a.count() }));
    return result.total;
  },

  async listTasksByProject(projectId: string): Promise<ProjectTaskRow[]> {
    const rows = await db.orm.public.Tasks.where((t) =>
      t.projectId.eq(varchar<26>(projectId)),
    )
      .orderBy((t) => t.createdAt.asc())
      .all();
    return rows;
  },

  async findTaskTemplatesByTemplateId(
    templateId: string,
  ): Promise<ProjectTaskTemplateRow[]> {
    const rows = await db.orm.public.TaskTemplates.where((t) =>
      t.projectTemplateId.eq(varchar<26>(templateId)),
    )
      .orderBy((t) => t.sortOrder.asc())
      .all();
    return rows;
  },

  createTask(
    data: {
      workspaceId: string;
      projectId: string;
      parentTaskId: string | null;
      title: string;
      description: string | null;
      status: string;
      priority: string;
    },
    orm: OrmClient = db.orm,
  ) {
    return orm.public.Tasks.create({
      id: varchar<26>(nanoid()),
      workspaceId: varchar<26>(data.workspaceId),
      projectId: varchar<26>(data.projectId),
      parentTaskId:
        data.parentTaskId === null ? null : varchar<26>(data.parentTaskId),
      title: varchar<200>(data.title),
      description: data.description,
      status: varchar<30>(data.status),
      priority: varchar<10>(data.priority),
      deadline: null,
      divisionId: null,
      assigneeId: null,
    });
  },
};
