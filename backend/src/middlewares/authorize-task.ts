import type { NextFunction, Request, Response } from 'express';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import type { Models } from '../../prisma/contract';
import { db } from '../../prisma/db';
import { varchar } from '../utils/varchar';
import {
  getRolePermissions,
  getWorkspaceMembershipWithPermissions,
  paramValue,
} from './authorize';
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from '../exceptions/index';

export type TaskRow = Scalars<Models.public_Tasks>;

export type TaskMembership = {
  roleId: string;
  roleName: string;
  permissions: string[];
};

/**
 * Izin task (spec v2 §14–§17) dicek "sesuai task scope":
 * pemanggil harus punya izin tersebut, DAN task-nya harus
 * berada dalam scope-nya.
 *
 * - Anggota workspace: izin diambil dari role keanggotaan
 *   workspace; scope mengikuti nama role (§14.1):
 *   OWNER/MANAGER melihat semua task; DIVISION_LEADER
 *   melihat task yang diberikan kepadanya, yang diberikan
 *   ke divisinya, dan subtask di bawah kewenangannya;
 *   MEMBER/role kustom hanya melihat task yang diberikan
 *   kepadanya.
 * - Anggota proyek saja (bukan anggota workspace): izin
 *   diambil dari role undangannya di proyek itu; scope =
 *   semua task di proyek tersebut.
 * - Bukan keduanya -> 403 TASK_ACCESS_DENIED.
 */
export async function loadTask(taskId: string): Promise<TaskRow> {
  const task = await db.orm.public.Tasks.where((t) =>
    t.id.eq(varchar<26>(taskId)),
  ).first();
  if (!task) {
    throw new NotFoundError('Task tidak ditemukan', 'TASK_NOT_FOUND');
  }
  return task;
}

async function findProjectMembershipWithPermissions(
  projectId: string,
  userId: string,
): Promise<TaskMembership | null> {
  const membership = await db.orm.public.ProjectMembers.where((m) =>
    m.projectId.eq(varchar<26>(projectId)),
  )
    .where((m) => m.userId.eq(varchar<26>(userId)))
    .first();
  if (!membership) {
    return null;
  }
  const role = await getRolePermissions(membership.roleId);
  return {
    roleId: membership.roleId,
    roleName: role.roleName,
    permissions: role.permissions,
  };
}

async function findLedDivisionIds(
  workspaceId: string,
  userId: string,
): Promise<string[]> {
  const divisions = await db.orm.public.Divisions.where((d) =>
    d.workspaceId.eq(varchar<26>(workspaceId)),
  )
    .where((d) => d.leaderId.eq(varchar<26>(userId)))
    .all();
  return divisions.map((d) => d.id);
}

/**
 * Apakah task ini berada dalam scope pemanggil (anggota
 * workspace)? Dipakai setelah izin spesifik dicek.
 */
export async function isTaskInScope(
  userId: string,
  task: TaskRow,
  membership: TaskMembership,
): Promise<boolean> {
  if (membership.roleName === 'OWNER' || membership.roleName === 'MANAGER') {
    return true;
  }
  if (task.assigneeId === userId) {
    return true;
  }
  if (membership.roleName === 'DIVISION_LEADER') {
    const ledDivisionIds = await findLedDivisionIds(task.workspaceId, userId);
    if (task.divisionId !== null && ledDivisionIds.includes(task.divisionId)) {
      return true;
    }
    // Subtask di bawah kewenangan: telusuri rantai parent
    // (dibatasi 10 tingkat) sampai ketemu task yang in-scope.
    let parentId = task.parentTaskId;
    for (let depth = 0; depth < 10 && parentId !== null; depth += 1) {
      const parent = await db.orm.public.Tasks.where((t) =>
        t.id.eq(varchar<26>(parentId as string)),
      ).first();
      if (!parent) {
        return false;
      }
      if (parent.assigneeId === userId) {
        return true;
      }
      if (
        parent.divisionId !== null &&
        ledDivisionIds.includes(parent.divisionId)
      ) {
        return true;
      }
      parentId = parent.parentTaskId;
    }
  }
  return false;
}

/**
 * Memastikan pemanggil boleh melakukan `permission` pada task
 * ini. Melempar 403 FORBIDDEN bila izin tidak dimiliki, dan
 * 403 TASK_ACCESS_DENIED bila task di luar scope-nya.
 * Mengembalikan keanggotaan yang dipakai (workspace atau
 * proyek) agar service bisa memakainya bila perlu.
 */
export async function assertTaskPermission(
  userId: string,
  task: TaskRow,
  permission: string,
): Promise<{ membership: TaskMembership; isWorkspaceMember: boolean }> {
  const membership = await getWorkspaceMembershipWithPermissions(
    userId,
    task.workspaceId,
  );
  if (membership) {
    if (!membership.permissions.includes(permission)) {
      throw new AuthorizationError(
        'Tidak memiliki permission',
        'FORBIDDEN',
      );
    }
    if (!(await isTaskInScope(userId, task, membership))) {
      throw new AuthorizationError(
        'Tidak memiliki akses ke task ini',
        'TASK_ACCESS_DENIED',
      );
    }
    return { membership, isWorkspaceMember: true };
  }

  const projectMembership = await findProjectMembershipWithPermissions(
    task.projectId,
    userId,
  );
  if (!projectMembership) {
    throw new AuthorizationError(
      'Tidak memiliki akses ke task ini',
      'TASK_ACCESS_DENIED',
    );
  }
  if (!projectMembership.permissions.includes(permission)) {
    throw new AuthorizationError('Tidak memiliki permission', 'FORBIDDEN');
  }
  return { membership: projectMembership, isWorkspaceMember: false };
}

/**
 * Middleware otorisasi task untuk satu endpoint.
 * Memuat task dari `:taskParam`, memastikan izin + scope,
 * lalu mengisi `req.task` (dan `req.workspace` bila pemanggil
 * anggota workspace).
 */
export function authorizeTask(
  permission: string,
  taskParamName = 'id',
) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthenticationError('Unauthorized');
      }
      const taskId = paramValue(req, taskParamName);
      if (!taskId) {
        throw new AuthenticationError('Unauthorized');
      }
      const task = await loadTask(taskId);
      const { membership, isWorkspaceMember } = await assertTaskPermission(
        userId,
        task,
        permission,
      );

      if (isWorkspaceMember) {
        req.workspace = {
          id: task.workspaceId,
          roleId: membership.roleId,
          roleName: membership.roleName,
          permissions: membership.permissions,
        };
      }
      req.task = {
        id: task.id,
        workspaceId: task.workspaceId,
        projectId: task.projectId,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}
