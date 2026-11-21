import { db } from '../../../../prisma/db';
import { WorkspaceRepository } from '../repositories/workspace-repository';
import type {
  IndustryRow,
  WorkspaceRoleRow,
  WorkspaceRow,
} from '../repositories/workspace-repository';
import {
  AuthenticationError,
  AuthorizationError,
  InvariantError,
  NotFoundError,
} from '../../../exceptions/index';
import { buildPaginationMeta, offsetOf } from '../../../utils/pagination';
import type {
  CreateWorkspaceInput,
  UpdateMemberRoleInput,
  UpdateWorkspaceInput,
} from '../validator/schema';

function toIndustry(industry: IndustryRow | null) {
  if (!industry) {
    return null;
  }
  return { id: industry.id, name: industry.name };
}

function toRole(role: WorkspaceRoleRow) {
  return {
    id: role.id,
    name: role.name,
    is_system: role.isSystem,
  };
}

function toWorkspaceDetail(
  workspace: WorkspaceRow,
  industry: IndustryRow | null,
) {
  return {
    id: workspace.id,
    name: workspace.name,
    industry: toIndustry(industry),
    owner_id: workspace.ownerId,
  };
}

export const WorkspaceService = {
  async createWorkspace(userId: string, input: CreateWorkspaceInput) {
    // Satu akun hanya boleh memiliki satu workspace (spec §8.1).
    const existing =
      await WorkspaceRepository.findWorkspaceByOwnerId(userId);
    if (existing) {
      throw new InvariantError(
        'User sudah memiliki satu workspace',
        'WORKSPACE_LIMIT_REACHED',
      );
    }

    const industry = await WorkspaceRepository.findIndustryById(
      input.industry_id,
    );
    if (!industry) {
      throw new NotFoundError(
        'Bidang usaha tidak ditemukan',
        'INDUSTRY_NOT_FOUND',
      );
    }

    const ownerRole =
      await WorkspaceRepository.findSystemRoleByName('OWNER');
    if (!ownerRole) {
      throw new Error('Role sistem OWNER belum di-seed');
    }

    // Pembuatan workspace + membership OWNER + onboarding_completed
    // harus atomik: bila salah satu gagal, semuanya dibatalkan.
    const workspace = await db.transaction(async (tx) => {
      const created = await WorkspaceRepository.createWorkspace(
        {
          name: input.name,
          industryId: input.industry_id,
          ownerId: userId,
        },
        tx.orm,
      );
      await WorkspaceRepository.createMembership(
        { workspaceId: created.id, userId, roleId: ownerRole.id },
        tx.orm,
      );
      await WorkspaceRepository.setUserOnboarding(userId, true, tx.orm);
      return created;
    });

    return {
      ...toWorkspaceDetail(workspace, industry),
      role: toRole(ownerRole),
    };
  },

  async listMyWorkspaces(
    userId: string,
    query: { page: number; limit: number },
  ) {
    const memberships =
      await WorkspaceRepository.findMembershipsByUser(userId);
    const workspaceIds = [...new Set(memberships.map((m) => m.workspaceId))];
    const roleIds = [...new Set(memberships.map((m) => m.roleId))];
    const [workspaces, roles] = await Promise.all([
      WorkspaceRepository.findWorkspacesByIds(workspaceIds),
      WorkspaceRepository.findRolesByIds(roleIds),
    ]);
    const workspaceById = new Map(workspaces.map((w) => [w.id, w]));
    const roleById = new Map(roles.map((r) => [r.id, r]));
    const industryIds = [
      ...new Set(
        workspaces
          .map((w) => w.industryId)
          .filter((id): id is NonNullable<typeof id> => id !== null),
      ),
    ];
    const industries =
      await WorkspaceRepository.findIndustriesByIds(industryIds);
    const industryById = new Map(industries.map((i) => [i.id, i]));

    const items = memberships
      .map((m) => {
        const workspace = workspaceById.get(m.workspaceId);
        const role = roleById.get(m.roleId);
        if (!workspace || !role) {
          return null;
        }
        return {
          id: workspace.id,
          name: workspace.name,
          industry: toIndustry(
            workspace.industryId
              ? (industryById.get(workspace.industryId) ?? null)
              : null,
          ),
          owner_id: workspace.ownerId,
          is_owner: workspace.ownerId === userId,
          role: toRole(role),
          createdAt: workspace.createdAt,
        };
      })
      .filter(
        (item): item is NonNullable<typeof item> => item !== null,
      )
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

    const total = items.length;
    const pageItems = items
      .slice(offsetOf(query.page, query.limit), offsetOf(query.page, query.limit) + query.limit)
      .map(({ createdAt: _createdAt, ...rest }) => rest);
    return {
      items: pageItems,
      pagination: buildPaginationMeta(query.page, query.limit, total),
    };
  },

  async getWorkspaceDetail(workspaceId: string) {
    const workspace =
      await WorkspaceRepository.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace tidak ditemukan', 'WORKSPACE_NOT_FOUND');
    }
    const [industry, memberCount] = await Promise.all([
      workspace.industryId
        ? WorkspaceRepository.findIndustryById(workspace.industryId)
        : Promise.resolve(null),
      WorkspaceRepository.countMembers(workspaceId),
    ]);
    return {
      ...toWorkspaceDetail(workspace, industry),
      memberCount,
    };
  },

  async updateWorkspace(
    workspaceId: string,
    input: UpdateWorkspaceInput,
  ) {
    let industry: IndustryRow | null = null;
    if (input.industry_id !== undefined) {
      industry = await WorkspaceRepository.findIndustryById(
        input.industry_id,
      );
      if (!industry) {
        throw new NotFoundError(
          'Bidang usaha tidak ditemukan',
          'INDUSTRY_NOT_FOUND',
        );
      }
    }

    const updated = await WorkspaceRepository.updateWorkspace(workspaceId, {
      name: input.name,
      industryId: input.industry_id,
    });
    if (!updated) {
      throw new NotFoundError('Workspace tidak ditemukan', 'WORKSPACE_NOT_FOUND');
    }
    if (!industry && updated.industryId) {
      industry = await WorkspaceRepository.findIndustryById(
        updated.industryId,
      );
    }
    return toWorkspaceDetail(updated, industry);
  },

  async deleteWorkspace(workspaceId: string): Promise<void> {
    await WorkspaceRepository.deleteWorkspace(workspaceId);
  },

  async listMembers(
    workspaceId: string,
    query: {
      page: number;
      limit: number;
      search?: string | undefined;
      role_id?: string | undefined;
    },
  ) {
    let userIds: string[] | undefined;
    if (query.search) {
      const users = await WorkspaceRepository.findUsersBySearch(query.search);
      userIds = users.map((u) => u.id);
      if (userIds.length === 0) {
        return {
          items: [],
          pagination: buildPaginationMeta(query.page, query.limit, 0),
        };
      }
    }

    const [rows, total] = await Promise.all([
      WorkspaceRepository.listMemberships(workspaceId, {
        roleId: query.role_id,
        userIds,
        limit: query.limit,
        offset: offsetOf(query.page, query.limit),
      }),
      WorkspaceRepository.countMemberships(workspaceId, {
        roleId: query.role_id,
        userIds,
      }),
    ]);

    const [users, roles] = await Promise.all([
      WorkspaceRepository.findUsersByIds(rows.map((r) => r.userId)),
      WorkspaceRepository.findRolesByIds(rows.map((r) => r.roleId)),
    ]);
    const userById = new Map(users.map((u) => [u.id, u]));
    const roleById = new Map(roles.map((r) => [r.id, r]));

    const items = rows
      .map((m) => {
        const user = userById.get(m.userId);
        const role = roleById.get(m.roleId);
        if (!user || !role) {
          return null;
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: toRole(role),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      items,
      pagination: buildPaginationMeta(query.page, query.limit, total),
    };
  },

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    input: UpdateMemberRoleInput,
  ) {
    const membership = await WorkspaceRepository.findMembership(
      workspaceId,
      userId,
    );
    if (!membership) {
      throw new NotFoundError(
        'Anggota tidak ditemukan di workspace ini',
        'USER_NOT_FOUND',
      );
    }

    const currentRole = await WorkspaceRepository.findRoleById(
      membership.roleId,
    );
    if (currentRole?.name === 'OWNER') {
      throw new AuthorizationError(
        'Role OWNER workspace tidak dapat diubah',
        'FORBIDDEN',
      );
    }

    const newRole = await WorkspaceRepository.findRoleById(input.role_id);
    if (!newRole) {
      throw new NotFoundError('Role tidak ditemukan', 'ROLE_NOT_FOUND');
    }
    if (newRole.name === 'OWNER') {
      throw new AuthorizationError(
        'Role OWNER tidak dapat diberikan lewat endpoint ini',
        'FORBIDDEN',
      );
    }
    if (newRole.workspaceId !== null && newRole.workspaceId !== workspaceId) {
      throw new AuthorizationError(
        'Role kustom bukan milik workspace ini',
        'ROLE_NOT_IN_WORKSPACE',
      );
    }

    const updated = await WorkspaceRepository.updateMembershipRole(
      workspaceId,
      userId,
      input.role_id,
    );
    if (!updated) {
      throw new NotFoundError(
        'Anggota tidak ditemukan di workspace ini',
        'USER_NOT_FOUND',
      );
    }
    const user = await WorkspaceRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User tidak ditemukan', 'USER_NOT_FOUND');
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: toRole(newRole),
    };
  },

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    const membership = await WorkspaceRepository.findMembership(
      workspaceId,
      userId,
    );
    if (!membership) {
      throw new NotFoundError(
        'Anggota tidak ditemukan di workspace ini',
        'USER_NOT_FOUND',
      );
    }

    const role = await WorkspaceRepository.findRoleById(membership.roleId);
    if (role?.name === 'OWNER') {
      throw new AuthorizationError(
        'OWNER workspace tidak dapat dikeluarkan',
        'FORBIDDEN',
      );
    }

    await WorkspaceRepository.clearDivisionLeaders(workspaceId, userId);
    await WorkspaceRepository.deleteMembership(workspaceId, userId);
  },
};
