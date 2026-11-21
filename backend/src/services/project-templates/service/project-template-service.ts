import { ProjectTemplateRepository } from '../repositories/project-template-repository';
import type {
  ProjectTemplateRow,
  TaskTemplateRow,
} from '../repositories/project-template-repository';
import {
  AuthorizationError,
  NotFoundError,
} from '../../../exceptions/index';
import type {
  CreateProjectTemplateInput,
  CreateTaskTemplateInput,
  UpdateProjectTemplateInput,
  UpdateTaskTemplateInput,
} from '../validator/schema';

function toProjectTemplate(template: ProjectTemplateRow) {
  return {
    id: template.id,
    industry_id: template.industryId,
    workspace_id: template.workspaceId,
    name: template.name,
    description: template.description,
    is_system: template.workspaceId === null,
  };
}

function toTaskTemplate(task: TaskTemplateRow) {
  return {
    id: task.id,
    project_template_id: task.projectTemplateId,
    parent_template_id: task.parentTemplateId,
    title: task.title,
    description: task.description,
    priority: task.priority,
    sort_order: task.sortOrder,
  };
}

/**
 * Template yang boleh dilihat/diubah di workspace ini: template
 * bawaan sistem (workspace_id NULL) atau template kustom milik
 * workspace ini. Template kustom workspace lain = tidak ada.
 */
async function loadTemplateForWorkspace(
  workspaceId: string,
  templateId: string,
) {
  const template =
    await ProjectTemplateRepository.findTemplateById(templateId);
  if (
    !template ||
    (template.workspaceId !== null && template.workspaceId !== workspaceId)
  ) {
    throw new NotFoundError(
      'Template proyek tidak ditemukan',
      'TEMPLATE_NOT_FOUND',
    );
  }
  return template;
}

function forbidSystemTemplate(template: ProjectTemplateRow) {
  if (template.workspaceId === null) {
    throw new AuthorizationError(
      'Template bawaan sistem tidak dapat diubah',
      'FORBIDDEN',
    );
  }
}

async function loadTaskTemplate(
  templateId: string,
  taskTemplateId: string,
) {
  const task =
    await ProjectTemplateRepository.findTaskTemplateById(taskTemplateId);
  if (!task || task.projectTemplateId !== templateId) {
    throw new NotFoundError(
      'Template tugas tidak ditemukan',
      'TASK_TEMPLATE_NOT_FOUND',
    );
  }
  return task;
}

export const ProjectTemplateService = {
  async listProjectTemplates(workspaceId: string) {
    const templates =
      await ProjectTemplateRepository.listTemplatesByWorkspace(workspaceId);
    return templates.map(toProjectTemplate);
  },

  async createProjectTemplate(
    userId: string,
    workspaceId: string,
    input: CreateProjectTemplateInput,
  ) {
    if (input.industry_id) {
      const industry = await ProjectTemplateRepository.findIndustryById(
        input.industry_id,
      );
      if (!industry) {
        throw new NotFoundError(
          'Bidang usaha tidak ditemukan',
          'INDUSTRY_NOT_FOUND',
        );
      }
    }

    const template = await ProjectTemplateRepository.createTemplate({
      workspaceId,
      industryId: input.industry_id ?? null,
      name: input.name,
      description: input.description ?? null,
      createdBy: userId,
    });
    return toProjectTemplate(template);
  },

  async getProjectTemplateDetail(workspaceId: string, templateId: string) {
    const template = await loadTemplateForWorkspace(workspaceId, templateId);
    const tasks =
      await ProjectTemplateRepository.listTaskTemplatesByTemplateId(
        template.id,
      );
    return {
      ...toProjectTemplate(template),
      tasks: tasks.map(toTaskTemplate),
    };
  },

  async updateProjectTemplate(
    workspaceId: string,
    templateId: string,
    input: UpdateProjectTemplateInput,
  ) {
    const template = await loadTemplateForWorkspace(workspaceId, templateId);
    forbidSystemTemplate(template);

    if (input.industry_id) {
      const industry = await ProjectTemplateRepository.findIndustryById(
        input.industry_id,
      );
      if (!industry) {
        throw new NotFoundError(
          'Bidang usaha tidak ditemukan',
          'INDUSTRY_NOT_FOUND',
        );
      }
    }

    const updated = await ProjectTemplateRepository.updateTemplate(
      template.id,
      {
        name: input.name,
        description: input.description,
        industryId: input.industry_id,
      },
    );
    if (!updated) {
      throw new NotFoundError(
        'Template proyek tidak ditemukan',
        'TEMPLATE_NOT_FOUND',
      );
    }
    return toProjectTemplate(updated);
  },

  async deleteProjectTemplate(workspaceId: string, templateId: string) {
    const template = await loadTemplateForWorkspace(workspaceId, templateId);
    forbidSystemTemplate(template);

    // Project yang sudah dibuat dari template ini tidak ikut
    // terhapus; project_template_id-nya jadi null (FK SetNull).
    // Template tugas ikut terhapus (FK Cascade).
    await ProjectTemplateRepository.deleteTemplate(template.id);
  },

  async listTaskTemplates(workspaceId: string, templateId: string) {
    const template = await loadTemplateForWorkspace(workspaceId, templateId);
    const tasks =
      await ProjectTemplateRepository.listTaskTemplatesByTemplateId(
        template.id,
      );
    return tasks.map(toTaskTemplate);
  },

  async createTaskTemplate(
    workspaceId: string,
    templateId: string,
    input: CreateTaskTemplateInput,
  ) {
    const template = await loadTemplateForWorkspace(workspaceId, templateId);
    forbidSystemTemplate(template);

    let parentTemplateId: string | null = null;
    if (input.parent_template_id) {
      const parent = await loadTaskTemplate(
        template.id,
        input.parent_template_id,
      );
      parentTemplateId = parent.id;
    }

    const task = await ProjectTemplateRepository.createTaskTemplate({
      projectTemplateId: template.id,
      parentTemplateId,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority,
      sortOrder: input.sort_order,
    });
    return toTaskTemplate(task);
  },

  async updateTaskTemplate(
    workspaceId: string,
    templateId: string,
    taskTemplateId: string,
    input: UpdateTaskTemplateInput,
  ) {
    const template = await loadTemplateForWorkspace(workspaceId, templateId);
    forbidSystemTemplate(template);
    const task = await loadTaskTemplate(template.id, taskTemplateId);

    let parentTemplateId: string | null | undefined;
    if (input.parent_template_id !== undefined) {
      const parent = await loadTaskTemplate(
        template.id,
        input.parent_template_id,
      );
      parentTemplateId = parent.id;
    }

    const updated = await ProjectTemplateRepository.updateTaskTemplate(
      task.id,
      {
        title: input.title,
        description: input.description,
        priority: input.priority,
        parentTemplateId,
        sortOrder: input.sort_order,
      },
    );
    if (!updated) {
      throw new NotFoundError(
        'Template tugas tidak ditemukan',
        'TASK_TEMPLATE_NOT_FOUND',
      );
    }
    return toTaskTemplate(updated);
  },

  async deleteTaskTemplate(
    workspaceId: string,
    templateId: string,
    taskTemplateId: string,
  ) {
    const template = await loadTemplateForWorkspace(workspaceId, templateId);
    forbidSystemTemplate(template);
    const task = await loadTaskTemplate(template.id, taskTemplateId);

    // Subtugas template di bawahnya ikut terhapus (FK Cascade).
    await ProjectTemplateRepository.deleteTaskTemplate(task.id);
  },
};
