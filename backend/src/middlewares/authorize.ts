import type { NextFunction, Request, Response } from 'express';
import { db } from '../../prisma/db';
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from '../exceptions/index';
import { varchar } from '../utils/varchar';

/** Ambil satu nilai param route (Express 5 mengetiknya string | string[]). */
export function paramValue(
  req: Request,
  name: string,
): string | undefined {
  const raw = req.params[name];
  return Array.isArray(raw) ? raw[0] : raw;
}

/**
 * Izin-izin milik satu role (dari `role_permissions`).
 * Dipakai `checkWorkspacePermission` dan `authorizeProject`.
 */
export async function getRolePermissions(roleId: string): Promise<{
  roleId: string;
  roleName: string;
  permissions: string[];
}> {
  const role = await db.orm.public.WorkspaceRoles.where((r) =>
    r.id.eq(varchar<26>(roleId)),
  ).first();
  const permissionRows = await db.orm.public.RolePermissions.where((p) =>
    p.roleId.eq(varchar<26>(roleId)),
  ).all();
  return {
    roleId,
    roleName: role?.name ?? '',
    permissions: permissionRows.map((p) => p.permission as string),
  };
}

/**
 * Keanggotaan workspace satu user beserta izin rolenya.
 * Mengembalikan `null` bila user bukan anggota workspace
 * (tidak melempar — dipakai `authorizeProject` yang punya
 * jalur kedua lewat keanggotaan proyek).
 */
export async function getWorkspaceMembershipWithPermissions(
  userId: string,
  workspaceId: string,
): Promise<{
  roleId: string;
  roleName: string;
  permissions: string[];
} | null> {
  const membership = await db.orm.public.WorkspaceMemberships.where((m) =>
    m.workspaceId.eq(varchar<26>(workspaceId)),
  )
    .where((m) => m.userId.eq(varchar<26>(userId)))
    .first();
  if (!membership) {
    return null;
  }
  return getRolePermissions(membership.roleId);
}

/**
 * Cek izin satu user di satu workspace (dipakai `authorize` dan
 * service yang resolve workspace-nya dari data, mis. resend
 * undangan). Melempar ClientError bila tidak lolos.
 *
 * - Workspace tidak ada -> 404 WORKSPACE_NOT_FOUND
 * - Pemanggil bukan anggota -> 403 WORKSPACE_NOT_MEMBER
 * - Anggota tapi tidak punya izin -> 403 FORBIDDEN
 */
export async function checkWorkspacePermission(
  userId: string,
  workspaceId: string,
  permission: string,
): Promise<{
  roleId: string;
  roleName: string;
  permissions: string[];
}> {
  const workspace = await db.orm.public.Workspaces.where((w) =>
    w.id.eq(varchar<26>(workspaceId)),
  ).first();
  if (!workspace) {
    throw new NotFoundError('Workspace tidak ditemukan', 'WORKSPACE_NOT_FOUND');
  }

  const membership = await getWorkspaceMembershipWithPermissions(
    userId,
    workspaceId,
  );
  if (!membership) {
    throw new AuthorizationError(
      'Bukan anggota workspace',
      'WORKSPACE_NOT_MEMBER',
    );
  }
  if (!membership.permissions.includes(permission)) {
    throw new AuthorizationError('Tidak memiliki permission', 'FORBIDDEN');
  }

  return membership;
}

/**
 * Otorisasi per workspace (spec v2 §2, §8).
 * Dipakai setelah `authenticateToken`. Membaca workspace dari
 * `req.params[paramName]` (default `id` — cocok dengan route
 * `/workspaces/:id/...`).
 *
 * - Workspace tidak ada -> 404 WORKSPACE_NOT_FOUND
 * - Pemanggil bukan anggota -> 403 WORKSPACE_NOT_MEMBER
 * - Anggota tapi tidak punya izin -> 403 FORBIDDEN
 * - Lolos -> `req.workspace` diisi { id, roleId, roleName, permissions }
 */
export function authorize(permission: string, paramName = 'id') {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        next(new AuthenticationError('Unauthorized'));
        return;
      }

      const workspaceId = paramValue(req, paramName);
      if (!workspaceId) {
        next(
          new NotFoundError('Workspace tidak ditemukan', 'WORKSPACE_NOT_FOUND'),
        );
        return;
      }

      req.workspace = {
        id: workspaceId,
        ...(await checkWorkspacePermission(userId, workspaceId, permission)),
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default authorize;
