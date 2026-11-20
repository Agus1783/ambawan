import type { Varchar } from '@prisma/orm-postgres/target/codec-types';
import { checkWorkspacePermission } from '../../../middlewares/authorize';
import { NotFoundError } from '../../../exceptions/index';
import { DashboardRepository } from '../repositories/dashboard-repository';
import type { DashboardTaskRow } from '../repositories/dashboard-repository';
import { TASK_STATUSES } from '../../tasks/service/task-service';

export const TASK_PRIORITIES = ['P1', 'P2', 'P3'] as const;

/**
 * ID task yang berada dalam scope DIVISION_LEADER: task yang
 * diberikan kepadanya, yang diberikan ke divisinya, beserta
 * seluruh subtask di bawahnya (fixpoint, maks 10 putaran).
 * Cerminan `leaderScopedTaskIds` di TaskService, bekerja pada
 * daftar task yang sudah diambil.
 */
function leaderScopedTaskIds(
  userId: string,
  ledDivisionIds: Set<string>,
  allTasks: DashboardTaskRow[],
): Set<string> {
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
  return scoped;
}

/**
 * Task-task dalam kewenangan pemanggil (spec §18: "anggota
 * hanya melihat statistik task dalam kewenangannya").
 * Aturan scope sama seperti daftar task (§14.1):
 * OWNER/MANAGER semua task; DIVISION_LEADER task miliknya +
 * divisinya + subtask di bawahnya; MEMBER/role kustom hanya
 * task yang diberikan kepadanya.
 */
async function scopedTasks(
  userId: string,
  workspaceId: string,
  roleName: string,
  allTasks: DashboardTaskRow[],
): Promise<DashboardTaskRow[]> {
  if (roleName === 'OWNER' || roleName === 'MANAGER') {
    return allTasks;
  }
  if (roleName === 'DIVISION_LEADER') {
    const ledDivisions =
      await DashboardRepository.findDivisionsLedByUser(workspaceId, userId);
    const scopedIds = leaderScopedTaskIds(
      userId,
      new Set(ledDivisions.map((d) => d.id)),
      allTasks,
    );
    return allTasks.filter((t) => scopedIds.has(t.id));
  }
  return allTasks.filter((t) => t.assigneeId === userId);
}

export const DashboardService = {
  async getSummary(userId: string, workspaceId: string) {
    const membership = await checkWorkspacePermission(
      userId,
      workspaceId,
      'dashboard.view',
    );
    const allTasks =
      await DashboardRepository.findTasksInWorkspace(workspaceId);
    const tasks = await scopedTasks(
      userId,
      workspaceId,
      membership.roleName,
      allTasks,
    );

    const now = new Date();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (t) => t.status === 'COMPLETED',
    ).length;
    const inProgressTasks = tasks.filter(
      (t) => t.status === 'IN_PROGRESS',
    ).length;
    const reviewTasks = tasks.filter((t) => t.status === 'REVIEW').length;
    // Terlambat: deadline sudah lewat dan task belum selesai
    // atau dibatalkan.
    const overdueTasks = tasks.filter(
      (t) =>
        t.deadline !== null &&
        new Date(t.deadline) < now &&
        t.status !== 'COMPLETED' &&
        t.status !== 'CANCELLED',
    ).length;
    const completionRate =
      totalTasks === 0
        ? 0
        : Math.round((completedTasks / totalTasks) * 100);

    return {
      workspace_id: workspaceId,
      totalTasks,
      completedTasks,
      inProgressTasks,
      reviewTasks,
      overdueTasks,
      completionRate,
    };
  },

  async getTaskStatistics(
    userId: string,
    query: {
      workspaceId: string;
      projectId?: string | undefined;
      divisionId?: string | undefined;
    },
  ) {
    const membership = await checkWorkspacePermission(
      userId,
      query.workspaceId,
      'analytics.view',
    );

    if (query.projectId) {
      const project = await DashboardRepository.findProjectById(
        query.projectId,
      );
      if (!project || project.workspaceId !== query.workspaceId) {
        throw new NotFoundError('Project tidak ditemukan', 'PROJECT_NOT_FOUND');
      }
    }
    if (query.divisionId) {
      const division = await DashboardRepository.findDivisionById(
        query.divisionId,
      );
      if (!division || division.workspaceId !== query.workspaceId) {
        throw new NotFoundError(
          'Division tidak ditemukan',
          'DIVISION_NOT_FOUND',
        );
      }
    }

    const allTasks = await DashboardRepository.findTasksInWorkspace(
      query.workspaceId,
    );
    let tasks = await scopedTasks(
      userId,
      query.workspaceId,
      membership.roleName,
      allTasks,
    );
    if (query.projectId) {
      tasks = tasks.filter((t) => t.projectId === query.projectId);
    }
    if (query.divisionId) {
      tasks = tasks.filter((t) => t.divisionId === query.divisionId);
    }

    const byStatus: Record<string, number> = {};
    for (const status of TASK_STATUSES) {
      byStatus[status] = 0;
    }
    for (const task of tasks) {
      const key = task.status as string;
      byStatus[key] = (byStatus[key] ?? 0) + 1;
    }
    const byPriority: Record<string, number> = {};
    for (const priority of TASK_PRIORITIES) {
      byPriority[priority] = 0;
    }
    for (const task of tasks) {
      const key = task.priority as string;
      byPriority[key] = (byPriority[key] ?? 0) + 1;
    }

    return {
      workspace_id: query.workspaceId,
      byStatus,
      byPriority,
    };
  },
};
