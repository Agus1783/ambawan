import type { NextFunction, Request, Response } from 'express';
import { db } from '../../prisma/db';
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from '../exceptions/index';
import { varchar } from '../utils/varchar';
import {
  getRolePermissions,
  getWorkspaceMembershipWithPermissions,
  paramValue,
} from './authorize';

/**
 * Otorisasi per proyek (dipakai route `/projects/:id/...` di
 * langkah 5). Membaca proyek dari `req.params[projectParamName]`
 * (default `id`).
 *
 * Dua jalur akses — yang pertama lolos langsung dipakai:
 *
 * 1. Anggota workspace pemilik proyek yang punya izin
 *    (`workspace_memberships` + `role_permissions`).
 * 2. Anggota proyek saja (`project_members`): user yang diundang
 *    ke proyek ini, BUKAN anggota workspace. Izinnya = izin
 *    role yang tercantum pada undangannya, berlaku HANYA di
 *    proyek ini.
 *
 * - Proyek tidak ada -> 404 PROJECT_NOT_FOUND
 * - Bukan anggota workspace maupun proyek -> 403 FORBIDDEN
 *   (spec §13 tidak punya kode PROJECT_NOT_MEMBER; FORBIDDEN
 *   yang dipakai di semua tabel error proyek)
 * - Anggota tapi tidak punya izin -> 403 FORBIDDEN
 * - Lolos -> `req.project` diisi { id, workspaceId, roleId,
 *   roleName, permissions }; `req.workspace` hanya diisi bila
 *   pemanggil lolos lewat jalur 1 (anggota workspace).
 */
export function authorizeProject(
  permission: string,
  projectParamName = 'id',
) {
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

      const projectId = paramValue(req, projectParamName);
      if (!projectId) {
        next(new NotFoundError('Project tidak ditemukan', 'PROJECT_NOT_FOUND'));
        return;
      }

      const project = await db.orm.public.Projects.where((p) =>
        p.id.eq(varchar<26>(projectId)),
      ).first();
      if (!project) {
        next(new NotFoundError('Project tidak ditemukan', 'PROJECT_NOT_FOUND'));
        return;
      }

      // Jalur 1: anggota workspace pemilik proyek.
      const workspaceMembership =
        await getWorkspaceMembershipWithPermissions(
          userId,
          project.workspaceId,
        );
      if (workspaceMembership) {
        if (!workspaceMembership.permissions.includes(permission)) {
          next(
            new AuthorizationError('Tidak memiliki permission', 'FORBIDDEN'),
          );
          return;
        }
        req.workspace = {
          id: project.workspaceId,
          ...workspaceMembership,
        };
        req.project = {
          id: project.id,
          workspaceId: project.workspaceId,
          ...workspaceMembership,
        };
        next();
        return;
      }

      // Jalur 2: anggota proyek saja (bukan anggota workspace).
      const projectMembership = await db.orm.public.ProjectMembers.where(
        (m) => m.projectId.eq(varchar<26>(project.id)),
      )
        .where((m) => m.userId.eq(varchar<26>(userId)))
        .first();
      if (!projectMembership) {
        next(
          new AuthorizationError(
            'Bukan anggota proyek ini',
            'FORBIDDEN',
          ),
        );
        return;
      }

      const role = await getRolePermissions(projectMembership.roleId);
      if (!role.permissions.includes(permission)) {
        next(new AuthorizationError('Tidak memiliki permission', 'FORBIDDEN'));
        return;
      }
      req.project = {
        id: project.id,
        workspaceId: project.workspaceId,
        ...role,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default authorizeProject;
