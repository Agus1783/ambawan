import { DivisionRepository } from '../repositories/division-repository';
import type { DivisionRow } from '../repositories/division-repository';
import { checkWorkspacePermission } from '../../../middlewares/authorize';
import {
  ClientError,
  InvariantError,
  NotFoundError,
} from '../../../exceptions/index';
import { buildPaginationMeta, offsetOf } from '../../../utils/pagination';
import type {
  CreateDivisionInput,
  SetDivisionLeaderInput,
  UpdateDivisionInput,
} from '../validator/schema';

function toRole(role: { id: string; name: string; isSystem: boolean }) {
  return {
    id: role.id,
    name: role.name,
    is_system: role.isSystem,
  };
}

/**
 * Anggota divisi = ketua divisi + para assignee task di divisi
 * ini (gabungan, tanpa duplikat). Tidak ada tabel
 * division_members di skema: keanggotaan divisi dinyatakan
 * lewat penugasan task (`tasks.division_id` + `assignee_id`).
 * Hanya user yang anggota workspace yang ditampilkan
 * (assignee bisa saja anggota proyek saja).
 */
async function resolveDivisionMembers(division: DivisionRow) {
  const assigneeIds =
    await DivisionRepository.findTaskAssigneeIds(division.id);
  const ids = [
    ...new Set([
      ...(division.leaderId ? [division.leaderId] : []),
      ...assigneeIds,
    ]),
  ];
  if (ids.length === 0) {
    return [];
  }
  const [users, memberships] = await Promise.all([
    DivisionRepository.findUsersByIds(ids),
    DivisionRepository.findMembershipsByUserIds(division.workspaceId, ids),
  ]);
  const roles = await DivisionRepository.findRolesByIds(
    memberships.map((m) => m.roleId),
  );
  const membershipByUserId = new Map(memberships.map((m) => [m.userId, m]));
  const roleById = new Map(roles.map((r) => [r.id, r]));
  return users
    .map((user) => {
      const membership = membershipByUserId.get(user.id);
      const role = membership ? roleById.get(membership.roleId) : undefined;
      if (!membership || !role) {
        return null;
      }
      return { id: user.id, name: user.name, role: toRole(role) };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);
}

async function loadDivision(divisionId: string) {
  const division = await DivisionRepository.findById(divisionId);
  if (!division) {
    throw new NotFoundError('Division tidak ditemukan', 'DIVISION_NOT_FOUND');
  }
  return division;
}

function toDivisionWithLeader(
  division: DivisionRow,
  leader: { id: string; name: string } | null,
) {
  return {
    id: division.id,
    workspace_id: division.workspaceId,
    name: division.name,
    leader,
  };
}

export const DivisionService = {
  async listDivisions(
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
      'workspace.view',
    );

    const [rows, total] = await Promise.all([
      DivisionRepository.listDivisions(query.workspaceId, {
        search: query.search,
        limit: query.limit,
        offset: offsetOf(query.page, query.limit),
      }),
      DivisionRepository.countDivisions(query.workspaceId, {
        search: query.search,
      }),
    ]);

    const leaderIds = rows
      .map((d) => d.leaderId)
      .filter((id): id is NonNullable<typeof id> => id !== null);
    const leaders = await DivisionRepository.findUsersByIds(leaderIds);
    const leaderById = new Map(leaders.map((u) => [u.id, u]));

    const items = await Promise.all(
      rows.map(async (division) => {
        const leader = division.leaderId
          ? leaderById.get(division.leaderId)
          : undefined;
        const members = await resolveDivisionMembers(division);
        return {
          ...toDivisionWithLeader(
            division,
            leader ? { id: leader.id, name: leader.name } : null,
          ),
          memberCount: members.length,
        };
      }),
    );

    return {
      items,
      pagination: buildPaginationMeta(query.page, query.limit, total),
    };
  },

  async createDivision(userId: string, input: CreateDivisionInput) {
    await checkWorkspacePermission(
      userId,
      input.workspace_id,
      'workspace.manage_divisions',
    );

    const existing = await DivisionRepository.findByWorkspaceAndName(
      input.workspace_id,
      input.name,
    );
    if (existing) {
      throw new InvariantError(
        'Nama division sudah dipakai di workspace ini',
        'RESOURCE_CONFLICT',
      );
    }

    const division = await DivisionRepository.createDivision({
      workspaceId: input.workspace_id,
      name: input.name,
    });
    return toDivisionWithLeader(division, null);
  },

  async getDivisionDetail(userId: string, divisionId: string) {
    const division = await loadDivision(divisionId);
    await checkWorkspacePermission(
      userId,
      division.workspaceId,
      'workspace.view',
    );
    const [leader, members] = await Promise.all([
      division.leaderId
        ? DivisionRepository.findUserById(division.leaderId)
        : Promise.resolve(null),
      resolveDivisionMembers(division),
    ]);
    return {
      ...toDivisionWithLeader(
        division,
        leader ? { id: leader.id, name: leader.name } : null,
      ),
      members,
    };
  },

  async updateDivision(
    userId: string,
    divisionId: string,
    input: UpdateDivisionInput,
  ) {
    const division = await loadDivision(divisionId);
    await checkWorkspacePermission(
      userId,
      division.workspaceId,
      'workspace.manage_divisions',
    );

    if (input.name !== division.name) {
      const existing = await DivisionRepository.findByWorkspaceAndName(
        division.workspaceId,
        input.name,
      );
      if (existing) {
        throw new InvariantError(
          'Nama division sudah dipakai di workspace ini',
          'RESOURCE_CONFLICT',
        );
      }
    }

    const updated = await DivisionRepository.updateDivision(division.id, {
      name: input.name,
    });
    if (!updated) {
      throw new NotFoundError('Division tidak ditemukan', 'DIVISION_NOT_FOUND');
    }
    const leader = updated.leaderId
      ? await DivisionRepository.findUserById(updated.leaderId)
      : null;
    return toDivisionWithLeader(
      updated,
      leader ? { id: leader.id, name: leader.name } : null,
    );
  },

  async deleteDivision(userId: string, divisionId: string) {
    const division = await loadDivision(divisionId);
    await checkWorkspacePermission(
      userId,
      division.workspaceId,
      'workspace.manage_divisions',
    );

    const taskCount = await DivisionRepository.countTasksByDivision(
      division.id,
    );
    if (taskCount > 0) {
      throw new InvariantError(
        'Division masih memiliki task',
        'DIVISION_NOT_EMPTY',
      );
    }

    await DivisionRepository.deleteDivision(division.id);
  },

  async listDivisionMembers(userId: string, divisionId: string) {
    const division = await loadDivision(divisionId);
    await checkWorkspacePermission(
      userId,
      division.workspaceId,
      'workspace.view',
    );
    return resolveDivisionMembers(division);
  },

  async setDivisionLeader(
    userId: string,
    divisionId: string,
    input: SetDivisionLeaderInput,
  ) {
    const division = await loadDivision(divisionId);
    await checkWorkspacePermission(
      userId,
      division.workspaceId,
      'workspace.manage_divisions',
    );

    // Ketua divisi harus anggota workspace yang sama. Menunjuk
    // ketua TIDAK mengubah role user tersebut (spec §12.7).
    const leaderUser = await DivisionRepository.findUserById(input.user_id);
    if (!leaderUser) {
      throw new NotFoundError('User tidak ditemukan', 'USER_NOT_FOUND');
    }
    const memberships = await DivisionRepository.findMembershipsByUserIds(
      division.workspaceId,
      [input.user_id],
    );
    if (memberships.length === 0) {
      throw new NotFoundError(
        'User bukan anggota workspace ini',
        'USER_NOT_FOUND',
      );
    }

    const updated = await DivisionRepository.updateDivision(division.id, {
      leaderId: input.user_id,
    });
    if (!updated) {
      throw new NotFoundError('Division tidak ditemukan', 'DIVISION_NOT_FOUND');
    }
    return {
      division_id: updated.id,
      leader: { id: leaderUser.id, name: leaderUser.name },
    };
  },
};
