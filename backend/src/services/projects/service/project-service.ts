import { db } from '../../../../prisma/db';
import { ProjectRepository } from '../repositories/project-repository';
import type {
  OrmClient,
  ProjectRow,
  ProjectTaskTemplateRow,
} from '../repositories/project-repository';
import { checkWorkspacePermission } from '../../../middlewares/authorize';
import {
  ClientError,
  NotFoundError,
} from '../../../exceptions/index';
import { buildPaginationMeta, offsetOf } from '../../../utils/pagination';
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from '../validator/schema';

function toProject(project: ProjectRow) {
  return {
    id: project.id,
    workspace_id: project.workspaceId,
    name: project.name,
    description: project.description,
    deadline: project.deadline,
    owner_id: project.ownerId,
    industry_id: project.industryId,
    project_template_id: project.projectTemplateId,
  };
}

function toTask(task: {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  deadline: string | null;
  assigneeId: string | null;
  parentTaskId: string | null;
  divisionId: string | null;
}) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    deadline: task.deadline,
    assignee_id: task.assigneeId,
    parent_task_id: task.parentTaskId,
    division_id: task.divisionId,
  };
}

async function loadProject(projectId: string) {
  const project = await ProjectRepository.findById(projectId);
  if (!project) {
    throw new NotFoundError('Project tidak ditemukan', 'PROJECT_NOT_FOUND');
  }
  return project;
}

/**
 * Membuat task dari template tugas, dengan hierarki subtugas
 * dipertahankan. Template dibuat bertahap: yang tanpa induk
 * dulu, lalu yang induknya sudah dibuat — berulang sampai
 * semua terbuat (penjaga: bila satu putaran tidak ada yang
 * terbuat, sisanya dibuat tanpa induk).
 */
async function createTasksFromTemplates(
  txOrm: OrmClient,
  workspaceId: string,
  projectId: string,
  templates: ProjectTaskTemplateRow[],
): Promise<number> {
  const createdTaskIdByTemplateId = new Map<string, string>();
  const pending = [...templates];
  let created = 0;

  while (pending.length > 0) {
    let progressed = false;
    for (let i = pending.length - 1; i >= 0; i -= 1) {
      const template = pending[i]!;
      const parentTemplateId = template.parentTemplateId;
      const parentTaskId =
        parentTemplateId === null
          ? null
          : createdTaskIdByTemplateId.get(parentTemplateId);
      // Induk belum dibuat -> tunggu putaran berikutnya.
      if (parentTemplateId !== null && parentTaskId === undefined) {
        continue;
      }
      const task = await ProjectRepository.createTask(
        {
          workspaceId,
          projectId,
          parentTaskId: parentTaskId ?? null,
          title: template.title,
          description: template.description,
          // Task template belum punya assignee -> BACKLOG.
          status: 'BACKLOG',
          priority: template.priority,
        },
        txOrm,
      );
      createdTaskIdByTemplateId.set(template.id, task.id);
      pending.splice(i, 1);
      created += 1;
      progressed = true;
    }
    if (!progressed) {
      // Siklus parent (tidak mungkin lewat API normal) — buat
      // sisanya sebagai task tingkat atas agar tidak macet.
      for (const template of pending) {
        const task = await ProjectRepository.createTask(
          {
            workspaceId,
            projectId,
            parentTaskId: null,
            title: template.title,
            description: template.description,
            status: 'BACKLOG',
            priority: template.priority,
          },
          txOrm,
        );
        createdTaskIdByTemplateId.set(template.id, task.id);
        created += 1;
      }
      break;
    }
  }
  return created;
}

export const ProjectService = {
  async listProjects(
    userId: string,
    query: {
      workspaceId?: string | undefined;
      page: number;
      limit: number;
      search?: string | undefined;
    },
  ) {
    if (!query.workspaceId) {
      throw new ClientError('workspace_id wajib diisi', 400, 'VALIDATION_ERROR', {
        workspace_id: 'workspace_id wajib diisi',
      });
    }
    await checkWorkspacePermission(
      userId,
      query.workspaceId,
      'project.view',
    );

    const [rows, total] = await Promise.all([
      ProjectRepository.listProjects(query.workspaceId, {
        search: query.search,
        limit: query.limit,
        offset: offsetOf(query.page, query.limit),
      }),
      ProjectRepository.countProjects(query.workspaceId, {
        search: query.search,
      }),
    ]);

    const items = await Promise.all(
      rows.map(async (project) => {
        const [taskCount, completedTaskCount] = await Promise.all([
          ProjectRepository.countTasksByProject(project.id),
          ProjectRepository.countCompletedTasksByProject(project.id),
        ]);
        return {
          ...toProject(project),
          taskCount,
          completedTaskCount,
        };
      }),
    );

    return {
      items,
      pagination: buildPaginationMeta(query.page, query.limit, total),
    };
  },

  async createProject(userId: string, input: CreateProjectInput) {
    const workspace = await ProjectRepository.findWorkspaceById(
      input.workspace_id,
    );
    if (!workspace) {
      throw new NotFoundError('Workspace tidak ditemukan', 'WORKSPACE_NOT_FOUND');
    }
    await checkWorkspacePermission(
      userId,
      input.workspace_id,
      'project.create',
    );

    // industry_id opsional; bila tidak diisi, pakai bidang
    // usaha workspace (§13.2).
    const industryId = input.industry_id ?? workspace.industryId;
    if (industryId !== null) {
      const industry = await ProjectRepository.findIndustryById(industryId);
      if (!industry) {
        throw new NotFoundError(
          'Bidang usaha tidak ditemukan',
          'INDUSTRY_NOT_FOUND',
        );
      }
    }

    let templates: ProjectTaskTemplateRow[] = [];
    if (input.project_template_id) {
      const template = await ProjectRepository.findTemplateById(
        input.project_template_id,
      );
      // Template kustom milik workspace lain dianggap tidak ada.
      if (
        !template ||
        (template.workspaceId !== null &&
          template.workspaceId !== input.workspace_id)
      ) {
        throw new NotFoundError(
          'Template proyek tidak ditemukan',
          'TEMPLATE_NOT_FOUND',
        );
      }
      // apply_task_template default true bila template diisi.
      const applyTemplate = input.apply_task_template ?? true;
      if (applyTemplate) {
        templates =
          await ProjectRepository.findTaskTemplatesByTemplateId(template.id);
      }
    }

    const { project, createdTasks } = await db.transaction(async (tx) => {
      const createdProject = await ProjectRepository.createProject(
        {
          workspaceId: input.workspace_id,
          name: input.name,
          description: input.description ?? null,
          deadline: input.deadline ?? null,
          ownerId: userId,
          industryId,
          projectTemplateId: input.project_template_id ?? null,
        },
        tx.orm,
      );
      const createdCount = await createTasksFromTemplates(
        tx.orm,
        input.workspace_id,
        createdProject.id,
        templates,
      );
      return { project: createdProject, createdTasks: createdCount };
    });

    return {
      ...toProject(project),
      createdTasks,
    };
  },

  async getProjectDetail(projectId: string) {
    const project = await loadProject(projectId);
    const tasks = await ProjectRepository.listTasksByProject(project.id);
    return {
      ...toProject(project),
      tasks: tasks.map(toTask),
    };
  },

  async updateProject(
    projectId: string,
    input: UpdateProjectInput,
  ) {
    const project = await loadProject(projectId);
    const updated = await ProjectRepository.updateProject(project.id, {
      name: input.name,
      description: input.description,
      deadline: input.deadline,
    });
    if (!updated) {
      throw new NotFoundError('Project tidak ditemukan', 'PROJECT_NOT_FOUND');
    }
    return toProject(updated);
  },

  async deleteProject(projectId: string) {
    const project = await loadProject(projectId);
    await ProjectRepository.deleteProject(project.id);
  },

  async getTemplateTasksPreview(userId: string, templateId: string) {
    const template = await ProjectRepository.findTemplateById(templateId);
    if (!template) {
      throw new NotFoundError(
        'Template proyek tidak ditemukan',
        'TEMPLATE_NOT_FOUND',
      );
    }
    // Template kustom: pemanggil harus anggota workspace pemilik
    // template; bila bukan, balas 404 (spec §13.6).
    if (template.workspaceId !== null) {
      const membership = await ProjectRepository.findMembership(
        template.workspaceId,
        userId,
      );
      if (!membership) {
        throw new NotFoundError(
          'Template proyek tidak ditemukan',
          'TEMPLATE_NOT_FOUND',
        );
      }
    }

    const tasks =
      await ProjectRepository.findTaskTemplatesByTemplateId(template.id);
    return {
      id: template.id,
      name: template.name,
      tasks: tasks.map((t) => ({
        id: t.id,
        parent_template_id: t.parentTemplateId,
        title: t.title,
        description: t.description,
        priority: t.priority,
        sort_order: t.sortOrder,
      })),
    };
  },

  async getProjectMembers(userId: string, projectId: string) {
    const project = await loadProject(projectId);
    await checkWorkspacePermission(
      userId,
      project.workspaceId,
      'member.view',
    );

    // Anggota proyek = owner proyek + baris project_members
    // (spec §13.7; owner TIDAK punya baris project_members).
    const projectMembers =
      await ProjectRepository.findProjectMembersByProject(project.id);
    const userIds = [
      ...new Set([project.ownerId, ...projectMembers.map((m) => m.userId)]),
    ];
    const [users, roles] = await Promise.all([
      ProjectRepository.findUsersByIds(userIds),
      ProjectRepository.findRolesByIds(
        projectMembers.map((m) => m.roleId),
      ),
    ]);
    const roleById = new Map(roles.map((r) => [r.id, r]));
    const projectMemberByUserId = new Map(
      projectMembers.map((m) => [m.userId, m]),
    );
    const userById = new Map(users.map((u) => [u.id, u]));

    const items: {
      id: string;
      name: string;
      email: string;
      role: { id: string; name: string; is_system: boolean };
    }[] = [];
    for (const id of userIds) {
      const user = userById.get(id);
      if (!user) {
        continue;
      }
      const projectMember = projectMemberByUserId.get(id);
      let role = projectMember
        ? roleById.get(projectMember.roleId)
        : undefined;
      if (!role && id === project.ownerId) {
        // Role owner proyek = role keanggotaan workspace-nya.
        const membership = await ProjectRepository.findMembership(
          project.workspaceId,
          id,
        );
        if (membership) {
          const ownerRoles = await ProjectRepository.findRolesByIds([
            membership.roleId,
          ]);
          role = ownerRoles[0];
        }
      }
      if (!role) {
        continue;
      }
      items.push({
        id: user.id,
        name: user.name,
        email: user.email,
        role: { id: role.id, name: role.name, is_system: role.isSystem },
      });
    }
    return items;
  },
};
