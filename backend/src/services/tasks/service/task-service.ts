import { db } from '../../../../prisma/db';
import { TaskRepository } from '../repositories/task-repository';
import type {
  TaskDivisionRow,
  TaskRow,
  TaskUserRow,
} from '../repositories/task-repository';
import type { Varchar } from '@prisma/orm-postgres/target/codec-types';
import { TaskHistoryRepository } from '../../task-history/repositories/task-history-repository';
import {
  checkWorkspacePermission,
  getWorkspaceMembershipWithPermissions,
} from '../../../middlewares/authorize';
import {
  ClientError,
  NotFoundError,
} from '../../../exceptions/index';
import { buildPaginationMeta, offsetOf } from '../../../utils/pagination';
import type {
  CreateTaskInput,
  DelegateTaskInput,
  UpdateTaskInput,
} from '../validator/schema';

export const TASK_STATUSES = [
  'BACKLOG',
  'ASSIGNED',
  'IN_PROGRESS',
  'REVIEW',
  'COMPLETED',
  'BLOCKED',
  'CANCELLED',
] as const;

function toTaskListItem(
  task: TaskRow,
  lookups: {
    projectById: Map<string, { id: string; name: string }>;
    divisionById: Map<string, { id: string; name: string }>;
    userById: Map<string, { id: string; name: string }>;
  },
) {
  const project = lookups.projectById.get(task.projectId);
  const division =
    task.divisionId !== null
      ? lookups.divisionById.get(task.divisionId)
      : undefined;
  const assignee =
    task.assigneeId !== null
      ? lookups.userById.get(task.assigneeId)
      : undefined;
  return {
    id: task.id,
    workspace_id: task.workspaceId,
    title: task.title,
    status: task.status,
    priority: task.priority,
    deadline: task.deadline,
    project: project ? { id: project.id, name: project.name } : null,
    division: division ? { id: division.id, name: division.name } : null,
    assignee: assignee ? { id: assignee.id, name: assignee.name } : null,
  };
}

async function loadLookups(tasks: TaskRow[]) {
  const [projects, divisions, users] = await Promise.all([
    TaskRepository.findProjectsByIds([
      ...new Set(tasks.map((t) => t.projectId)),
    ]),
    TaskRepository.findDivisionsByIds([
      ...new Set(
        tasks
          .map((t) => t.divisionId)
          .filter((id): id is NonNullable<typeof id> => id !== null),
      ),
    ]),
    TaskRepository.findUsersByIds([
      ...new Set(
        tasks
          .map((t) => t.assigneeId)
          .filter((id): id is NonNullable<typeof id> => id !== null),
      ),
    ]),
  ]);
  return {
    projectById: new Map(projects.map((p) => [p.id, p])),
    divisionById: new Map(divisions.map((d) => [d.id, d])),
    userById: new Map(users.map((u) => [u.id, u])),
  };
}

async function loadTask(taskId: string) {
  const task = await TaskRepository.findById(taskId);
  if (!task) {
    throw new NotFoundError('Task tidak ditemukan', 'TASK_NOT_FOUND');
  }
  return task;
}

/**
 * ID task yang berada dalam scope DIVISION_LEADER: task yang
 * diberikan kepadanya, yang diberikan ke divisinya, beserta
 * seluruh subtask di bawahnya (fixpoint, maks 10 putaran).
 */
async function leaderScopedTaskIds(
  userId: string,
  workspaceId: string,
): Promise<string[]> {
  const ledDivisions = await TaskRepository.findDivisionsLedByUser(
    workspaceId,
    userId,
  );
  const ledDivisionIds = new Set(ledDivisions.map((d) => d.id));
  const allTasks = await TaskRepository.findAllTasksInWorkspace(workspaceId);

  const scoped = new Set(
    allTasks
      .filter(
        (t) =>
          t.assigneeId === userId ||
          (t.divisionId !== null && ledDivisionIds.has(t.divisionId)),
      )
      .map((t) => t.id),
  );
  const childrenByParent = new Map<Varchar<26>, Varchar<26>[]>();
  for (const task of allTasks) {
    if (task.parentTaskId !== null) {
      const siblings = childrenByParent.get(task.parentTaskId) ?? [];
      siblings.push(task.id);
      childrenByParent.set(task.parentTaskId, siblings);
    }
  }
  for (let round = 0; round < 10; round += 1) {
    let added = false;
    for (const parentId of [...scoped]) {
      for (const childId of childrenByParent.get(parentId) ?? []) {
        if (!scoped.has(childId)) {
          scoped.add(childId);
          added = true;
        }
      }
    }
    if (!added) {
      break;
    }
  }
  return [...scoped];
}

export const TaskService = {
  async listTasks(
    userId: string,
    query: {
      workspaceId?: string | undefined;
      page: number;
      limit: number;
      search?: string | undefined;
      status?: string | undefined;
      priority?: string | undefined;
      projectId?: string | undefined;
      divisionId?: string | undefined;
      assigneeId?: string | undefined;
      sort: 'deadline' | 'createdAt';
      order: 'asc' | 'desc';
    },
  ) {
    if (!query.workspaceId) {
      throw new ClientError('workspace_id wajib diisi', 400, 'VALIDATION_ERROR', {
        workspace_id: 'workspace_id wajib diisi',
      });
    }
    const membership = await checkWorkspacePermission(
      userId,
      query.workspaceId,
      'task.view',
    );

    // Scope daftar mengikuti nama role (§14.1).
    let taskIds: string[] | undefined;
    let assigneeFilter = query.assigneeId;
    if (
      membership.roleName !== 'OWNER' &&
      membership.roleName !== 'MANAGER'
    ) {
      if (membership.roleName === 'DIVISION_LEADER') {
        taskIds = await leaderScopedTaskIds(userId, query.workspaceId);
        if (taskIds.length === 0) {
          return {
            items: [],
            pagination: buildPaginationMeta(query.page, query.limit, 0),
          };
        }
      } else {
        // MEMBER dan role kustom: hanya task yang diberikan
        // kepadanya — paksa filter assignee ke dirinya sendiri.
        assigneeFilter = userId;
      }
    }

    const filters = {
      search: query.search,
      status: query.status,
      priority: query.priority,
      projectId: query.projectId,
      divisionId: query.divisionId,
      assigneeId: assigneeFilter,
      taskIds,
    };
    const [rows, total] = await Promise.all([
      TaskRepository.listTasks(query.workspaceId, filters, {
        limit: query.limit,
        offset: offsetOf(query.page, query.limit),
        sort: query.sort,
        order: query.order,
      }),
      TaskRepository.countTasks(query.workspaceId, filters),
    ]);

    const lookups = await loadLookups(rows);
    return {
      items: rows.map((task) => toTaskListItem(task, lookups)),
      pagination: buildPaginationMeta(query.page, query.limit, total),
    };
  },

  async createTask(userId: string, input: CreateTaskInput) {
    await checkWorkspacePermission(
      userId,
      input.workspace_id,
      'task.create',
    );

    const project = await TaskRepository.findProjectById(input.project_id);
    if (!project || project.workspaceId !== input.workspace_id) {
      throw new NotFoundError('Project tidak ditemukan', 'PROJECT_NOT_FOUND');
    }

    let parentTask: TaskRow | null = null;
    if (input.parent_task_id) {
      parentTask = await TaskRepository.findById(input.parent_task_id);
      if (!parentTask || parentTask.projectId !== input.project_id) {
        throw new NotFoundError('Parent task tidak ditemukan', 'TASK_NOT_FOUND');
      }
    }

    if (input.assignee_id) {
      const assignee = await TaskRepository.findUserById(input.assignee_id);
      if (!assignee) {
        throw new NotFoundError('User tidak ditemukan', 'USER_NOT_FOUND');
      }
      const membership = await TaskRepository.findMembership(
        input.workspace_id,
        input.assignee_id,
      );
      if (!membership) {
        throw new NotFoundError(
          'User bukan anggota workspace ini',
          'USER_NOT_FOUND',
        );
      }
    }

    if (input.division_id) {
      const division = await TaskRepository.findDivisionById(
        input.division_id,
      );
      if (!division || division.workspaceId !== input.workspace_id) {
        throw new NotFoundError('Division tidak ditemukan', 'DIVISION_NOT_FOUND');
      }
    }

    const task = await db.transaction(async (tx) => {
      const created = await TaskRepository.createTask(
        {
          workspaceId: input.workspace_id,
          projectId: input.project_id,
          parentTaskId: input.parent_task_id ?? null,
          title: input.title,
          description: input.description ?? null,
          priority: input.priority,
          deadline: input.deadline ?? null,
          assigneeId: input.assignee_id ?? null,
          divisionId: input.division_id ?? null,
        },
        tx.orm,
      );
      await TaskHistoryRepository.createHistory(
        {
          taskId: created.id,
          userId,
          action: 'CREATED',
          description: `Task "${created.title}" dibuat`,
        },
        tx.orm,
      );
      return created;
    });

    return {
      id: task.id,
      workspace_id: task.workspaceId,
      title: task.title,
      status: task.status,
      priority: task.priority,
    };
  },

  async getTaskDetail(taskId: string) {
    const task = await loadTask(taskId);
    const lookups = await loadLookups([task]);
    const parent = task.parentTaskId
      ? await TaskRepository.findById(task.parentTaskId)
      : null;
    return {
      ...toTaskListItem(task, lookups),
      description: task.description,
      parentTask: parent ? { id: parent.id, title: parent.title } : null,
    };
  },

  async updateTask(
    userId: string,
    taskId: string,
    input: UpdateTaskInput,
  ) {
    const task = await loadTask(taskId);

    if (input.assignee_id !== undefined) {
      const assignee = await TaskRepository.findUserById(input.assignee_id);
      if (!assignee) {
        throw new NotFoundError('User tidak ditemukan', 'USER_NOT_FOUND');
      }
      const membership = await TaskRepository.findMembership(
        task.workspaceId,
        input.assignee_id,
      );
      if (!membership) {
        throw new NotFoundError(
          'User bukan anggota workspace ini',
          'USER_NOT_FOUND',
        );
      }
    }

    if (input.division_id !== undefined) {
      const division = await TaskRepository.findDivisionById(
        input.division_id,
      );
      if (!division || division.workspaceId !== task.workspaceId) {
        throw new NotFoundError('Division tidak ditemukan', 'DIVISION_NOT_FOUND');
      }
    }

    const updated = await db.transaction(async (tx) => {
      const row = await TaskRepository.updateTask(
        task.id,
        {
          title: input.title,
          description: input.description,
          priority: input.priority,
          deadline: input.deadline,
          assigneeId: input.assignee_id,
          divisionId: input.division_id,
        },
        tx.orm,
      );
      await TaskHistoryRepository.createHistory(
        {
          taskId: task.id,
          userId,
          action: 'UPDATED',
          description: `Task "${task.title}" diperbarui`,
        },
        tx.orm,
      );
      return row;
    });
    if (!updated) {
      throw new NotFoundError('Task tidak ditemukan', 'TASK_NOT_FOUND');
    }
    return {
      id: updated.id,
      workspace_id: updated.workspaceId,
      title: updated.title,
      status: updated.status,
      priority: updated.priority,
    };
  },

  async deleteTask(taskId: string) {
    const task = await loadTask(taskId);
    // Subtask ikut terhapus (FK Cascade).
    await TaskRepository.deleteTask(task.id);
  },

  async updateTaskStatus(
    userId: string,
    taskId: string,
    status: string,
  ) {
    if (!(TASK_STATUSES as readonly string[]).includes(status)) {
      throw new ClientError(
        'Status task tidak valid',
        400,
        'INVALID_TASK_STATUS',
      );
    }
    const task = await loadTask(taskId);
    const updated = await db.transaction(async (tx) => {
      const row = await TaskRepository.updateTask(
        task.id,
        { status },
        tx.orm,
      );
      await TaskHistoryRepository.createHistory(
        {
          taskId: task.id,
          userId,
          action: 'STATUS_CHANGED',
          oldStatus: task.status,
          newStatus: status,
        },
        tx.orm,
      );
      return row;
    });
    if (!updated) {
      throw new NotFoundError('Task tidak ditemukan', 'TASK_NOT_FOUND');
    }
    return { id: updated.id, status: updated.status };
  },

  async delegateTask(
    userId: string,
    taskId: string,
    input: DelegateTaskInput,
  ) {
    const hasAssignee = input.assignee_id !== undefined;
    const hasDivision = input.division_id !== undefined;
    if (hasAssignee === hasDivision) {
      // Keduanya diisi atau keduanya kosong.
      throw new ClientError(
        'Delegasi harus ke satu user atau satu division',
        400,
        'INVALID_DELEGATION',
      );
    }
    const task = await loadTask(taskId);

    let targetUser: TaskUserRow | null = null;
    let targetDivision: TaskDivisionRow | null = null;

    if (hasAssignee) {
      const user = await TaskRepository.findUserById(input.assignee_id!);
      if (!user) {
        throw new ClientError(
          'User tujuan delegasi tidak ditemukan',
          400,
          'INVALID_DELEGATION',
        );
      }
      const membership = await TaskRepository.findMembership(
        task.workspaceId,
        input.assignee_id!,
      );
      if (!membership) {
        throw new ClientError(
          'User tujuan delegasi bukan anggota workspace ini',
          400,
          'INVALID_DELEGATION',
        );
      }
      targetUser = user;
    } else {
      const division = await TaskRepository.findDivisionById(
        input.division_id!,
      );
      if (!division || division.workspaceId !== task.workspaceId) {
        throw new ClientError(
          'Division tujuan delegasi tidak ditemukan',
          400,
          'INVALID_DELEGATION',
        );
      }
      targetDivision = division;
    }

    // DIVISION_LEADER hanya boleh mendelegasikan kepada anggota
    // divisinya (spec §14.7).
    const callerMembership = await getWorkspaceMembershipWithPermissions(
      userId,
      task.workspaceId,
    );
    if (callerMembership?.roleName === 'DIVISION_LEADER') {
      const ledDivisions = await TaskRepository.findDivisionsLedByUser(
        task.workspaceId,
        userId,
      );
      const ledDivisionIds = ledDivisions.map((d) => d.id);
      if (targetDivision && !ledDivisionIds.includes(targetDivision.id)) {
        throw new ClientError(
          'Division leader hanya dapat mendelegasikan ke divisinya sendiri',
          400,
          'INVALID_DELEGATION',
        );
      }
      if (targetUser) {
        const allowedUserIds = new Set<string>([userId]);
        for (const division of ledDivisions) {
          const assigneeIds =
            await TaskRepository.findTaskAssigneeIdsByDivision(division.id);
          for (const id of assigneeIds) {
            allowedUserIds.add(id);
          }
          if (division.leaderId) {
            allowedUserIds.add(division.leaderId);
          }
        }
        if (!allowedUserIds.has(targetUser.id)) {
          throw new ClientError(
            'Division leader hanya dapat mendelegasikan kepada anggota divisinya',
            400,
            'INVALID_DELEGATION',
          );
        }
      }
    }

    const updated = await db.transaction(async (tx) => {
      const row = await TaskRepository.updateTask(
        task.id,
        {
          // Delegasi mengisi satu sisi dan mengosongkan sisi
          // lainnya (lihat contoh respons §14.7).
          assigneeId: hasAssignee ? input.assignee_id! : null,
          divisionId: hasDivision ? input.division_id! : null,
        },
        tx.orm,
      );
      await TaskHistoryRepository.createHistory(
        {
          taskId: task.id,
          userId,
          action: 'DELEGATED',
          description: targetUser
            ? `Task didelegasikan ke ${targetUser.name}`
            : `Task didelegasikan ke divisi ${targetDivision!.name}`,
        },
        tx.orm,
      );
      return row;
    });
    if (!updated) {
      throw new NotFoundError('Task tidak ditemukan', 'TASK_NOT_FOUND');
    }
    const lookups = await loadLookups([updated]);
    const item = toTaskListItem(updated, lookups);
    return {
      id: item.id,
      division: item.division,
      assignee: item.assignee,
    };
  },

  async getSubtasks(taskId: string) {
    const task = await loadTask(taskId);
    const subtasks = await TaskRepository.findSubtasks(task.id);
    const lookups = await loadLookups(subtasks);
    return subtasks.map((subtask) => {
      const assignee =
        subtask.assigneeId !== null
          ? lookups.userById.get(subtask.assigneeId)
          : undefined;
      return {
        id: subtask.id,
        title: subtask.title,
        status: subtask.status,
        assignee: assignee ? { id: assignee.id, name: assignee.name } : null,
      };
    });
  },
};
