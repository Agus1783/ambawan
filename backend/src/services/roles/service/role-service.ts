import { db } from '../../../../prisma/db';
import { RoleRepository } from '../repositories/role-repository';
import type { RoleRow } from '../repositories/role-repository';
import {
  AuthorizationError,
  InvariantError,
  NotFoundError,
} from '../../../exceptions/index';
import { PERMISSION_CATALOG } from '../../../utils/permissions';
import { invalidateCache } from '../../../utils/cache';
import type {
  CreateRoleInput,
  UpdateRoleInput,
} from '../validator/schema';

const SYSTEM_ROLE_NAMES = ['OWNER', 'MANAGER', 'DIVISION_LEADER', 'MEMBER'];

function toRoleResponse(
  role: RoleRow,
  permissions: string[],
) {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    is_system: role.isSystem,
    permissions,
  };
}

async function loadRoleForWorkspace(workspaceId: string, roleId: string) {
  const role = await RoleRepository.findById(roleId);
  // Role kustom milik workspace lain tidak terlihat dari sini.
  if (!role || (role.workspaceId !== null && role.workspaceId !== workspaceId)) {
    throw new NotFoundError('Role tidak ditemukan', 'ROLE_NOT_FOUND');
  }
  return role;
}

export const RoleService = {
  getPermissionCatalog() {
    return PERMISSION_CATALOG;
  },

  async listRoles(workspaceId: string) {
    const [systemRoles, customRoles] = await Promise.all([
      RoleRepository.listSystemRoles(),
      RoleRepository.listCustomRolesByWorkspace(workspaceId),
    ]);
    const roles = [...systemRoles, ...customRoles];
    const permissionRows = await RoleRepository.findPermissionsByRoles(
      roles.map((r) => r.id),
    );
    const permissionsByRole = new Map<string, string[]>();
    for (const row of permissionRows) {
      const list = permissionsByRole.get(row.roleId) ?? [];
      list.push(row.permission as string);
      permissionsByRole.set(row.roleId, list);
    }
    return roles.map((role) =>
      toRoleResponse(role, permissionsByRole.get(role.id) ?? []),
    );
  },

  async getRoleDetail(workspaceId: string, roleId: string) {
    const role = await loadRoleForWorkspace(workspaceId, roleId);
    const permissionRows = await RoleRepository.findPermissionsByRoles([
      role.id,
    ]);
    return toRoleResponse(
      role,
      permissionRows.map((p) => p.permission as string),
    );
  },

  async createRole(
    workspaceId: string,
    userId: string,
    input: CreateRoleInput,
  ) {
    const permissions = [...new Set(input.permissions)];

    if (SYSTEM_ROLE_NAMES.includes(input.name)) {
      throw new InvariantError(
        'Nama role sudah dipakai oleh role bawaan sistem',
        'RESOURCE_CONFLICT',
      );
    }
    const existing = await RoleRepository.findByNameInWorkspace(
      input.name,
      workspaceId,
    );
    if (existing) {
      throw new InvariantError(
        'Nama role sudah dipakai di workspace ini',
        'RESOURCE_CONFLICT',
      );
    }

    const role = await db.transaction(async (tx) => {
      const created = await RoleRepository.createRole(
        {
          name: input.name,
          description: input.description,
          workspaceId,
          createdBy: userId,
        },
        tx.orm,
      );
      await RoleRepository.createPermissions(created.id, permissions, tx.orm);
      return created;
    });
    // Susunan role/izin berubah -> katalog izin yang ter-cache
    // kedaluwarsa (best-effort, tidak pernah throw).
    await invalidateCache('permissions:catalog');
    return toRoleResponse(role, permissions);
  },

  async updateRole(
    workspaceId: string,
    roleId: string,
    input: UpdateRoleInput,
  ) {
    const role = await loadRoleForWorkspace(workspaceId, roleId);
    if (role.isSystem) {
      throw new AuthorizationError(
        'Role bawaan sistem tidak dapat diubah',
        'ROLE_SYSTEM_PROTECTED',
      );
    }

    if (input.name !== undefined && input.name !== role.name) {
      if (SYSTEM_ROLE_NAMES.includes(input.name)) {
        throw new InvariantError(
          'Nama role sudah dipakai oleh role bawaan sistem',
          'RESOURCE_CONFLICT',
        );
      }
      const existing = await RoleRepository.findByNameInWorkspace(
        input.name,
        workspaceId,
      );
      if (existing) {
        throw new InvariantError(
          'Nama role sudah dipakai di workspace ini',
          'RESOURCE_CONFLICT',
        );
      }
    }

    const permissions =
      input.permissions !== undefined
        ? [...new Set(input.permissions)]
        : undefined;

    const updated = await db.transaction(async (tx) => {
      const row = await RoleRepository.updateRole(
        roleId,
        {
          name: input.name,
          description: input.description,
        },
        tx.orm,
      );
      if (permissions !== undefined) {
        await RoleRepository.replacePermissions(roleId, permissions, tx.orm);
      }
      return row;
    });
    if (!updated) {
      throw new NotFoundError('Role tidak ditemukan', 'ROLE_NOT_FOUND');
    }

    const permissionRows = await RoleRepository.findPermissionsByRoles([
      roleId,
    ]);
    // Susunan role/izin berubah -> katalog izin yang ter-cache
    // kedaluwarsa (best-effort, tidak pernah throw).
    await invalidateCache('permissions:catalog');
    return toRoleResponse(
      updated,
      permissionRows.map((p) => p.permission as string),
    );
  },

  async deleteRole(workspaceId: string, roleId: string): Promise<void> {
    const role = await loadRoleForWorkspace(workspaceId, roleId);
    if (role.isSystem) {
      throw new AuthorizationError(
        'Role bawaan sistem tidak dapat dihapus',
        'ROLE_SYSTEM_PROTECTED',
      );
    }

    const [memberCount, invitationCount] = await Promise.all([
      RoleRepository.countMembershipsByRole(roleId),
      RoleRepository.countPendingInvitationsByRole(roleId),
    ]);
    if (memberCount > 0 || invitationCount > 0) {
      throw new InvariantError(
        'Role masih dipakai anggota atau undangan pending',
        'ROLE_IN_USE',
      );
    }

    await RoleRepository.deleteRole(roleId);
    // Susunan role/izin berubah -> katalog izin yang ter-cache
    // kedaluwarsa (best-effort, tidak pernah throw).
    await invalidateCache('permissions:catalog');
  },
};
