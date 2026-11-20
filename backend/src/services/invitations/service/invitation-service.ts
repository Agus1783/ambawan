import { nanoid } from 'nanoid';
import { db } from '../../../../prisma/db';
import { InvitationRepository } from '../repositories/invitation-repository';
import type {
  InvitationRoleRow,
  InvitationRow,
} from '../repositories/invitation-repository';
import { checkWorkspacePermission } from '../../../middlewares/authorize';
import {
  AuthorizationError,
  BadRequestError,
  ClientError,
  InvariantError,
  NotFoundError,
} from '../../../exceptions/index';
import { buildPaginationMeta, offsetOf } from '../../../utils/pagination';
import { sendInvitationEmailBestEffort } from '../../../utils/mailer';
import type { CreateInvitationInput } from '../validator/schema';

/** Masa berlaku undangan: 7 hari (spec §11, keputusan PRD §13.4). */
const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const INVITATION_STATUSES = ['PENDING', 'ACCEPTED', 'EXPIRED', 'DECLINED'];

function toRole(role: InvitationRoleRow) {
  return {
    id: role.id,
    name: role.name,
    is_system: role.isSystem,
  };
}

function isExpired(invitation: InvitationRow): boolean {
  return new Date(invitation.expiresAt).getTime() <= Date.now();
}

function newExpiryIso(): string {
  return new Date(Date.now() + INVITATION_TTL_MS).toISOString();
}

export const InvitationService = {
  async createInvitation(
    workspaceId: string,
    inviterId: string,
    input: CreateInvitationInput,
  ) {
    const role = await InvitationRepository.findRoleById(input.role_id);
    if (!role) {
      throw new NotFoundError('Role tidak ditemukan', 'ROLE_NOT_FOUND');
    }
    if (role.name === 'OWNER') {
      throw new BadRequestError(
        'Role OWNER tidak dapat diundang',
        'VALIDATION_ERROR',
      );
    }
    if (role.workspaceId !== null && role.workspaceId !== workspaceId) {
      throw new AuthorizationError(
        'Role kustom bukan milik workspace ini',
        'ROLE_NOT_IN_WORKSPACE',
      );
    }

    let projectId: string | null = null;
    let projectName: string | null = null;
    if (input.project_id !== undefined) {
      const project = await InvitationRepository.findProjectById(
        input.project_id,
      );
      if (!project || project.workspaceId !== workspaceId) {
        throw new NotFoundError('Project tidak ditemukan', 'PROJECT_NOT_FOUND');
      }
      projectId = project.id;
      projectName = project.name;
    }

    const invitedUser = await InvitationRepository.findUserByEmail(
      input.email,
    );
    if (invitedUser) {
      const membership = await InvitationRepository.findMembership(
        workspaceId,
        invitedUser.id,
      );
      if (membership) {
        throw new InvariantError(
          'Email sudah menjadi anggota workspace ini',
          'RESOURCE_CONFLICT',
        );
      }
    }

    const token = nanoid(48);
    const invitation = await InvitationRepository.createInvitation({
      workspaceId,
      projectId,
      email: input.email,
      roleId: role.id,
      invitedBy: inviterId,
      token,
      expiresAt: newExpiryIso(),
    });

    // Kirim email undangan (best-effort): bila SMTP belum
    // dikonfigurasi, token dicatat di log server seperti
    // sebelumnya; kegagalan kirim tidak menggagalkan request.
    const workspace = await InvitationRepository.findWorkspaceById(
      workspaceId,
    );
    await sendInvitationEmailBestEffort({
      to: input.email,
      workspaceName: workspace?.name ?? workspaceId,
      roleName: role.name,
      projectName,
      token,
      expiresAt: invitation.expiresAt,
    });

    return {
      id: invitation.id,
      workspace_id: invitation.workspaceId,
      project_id: invitation.projectId,
      email: invitation.email,
      role: toRole(role),
      status: invitation.status,
      expires_at: invitation.expiresAt,
    };
  },

  async listInvitations(
    workspaceId: string,
    query: {
      page: number;
      limit: number;
      status?: string | undefined;
    },
  ) {
    if (
      query.status !== undefined &&
      !INVITATION_STATUSES.includes(query.status)
    ) {
      throw new ClientError('Status tidak valid', 422, 'VALIDATION_ERROR', {
        status: 'Status tidak valid',
      });
    }

    const [rows, total] = await Promise.all([
      InvitationRepository.listInvitations(workspaceId, {
        status: query.status,
        limit: query.limit,
        offset: offsetOf(query.page, query.limit),
      }),
      InvitationRepository.countInvitations(workspaceId, {
        status: query.status,
      }),
    ]);

    const [users, roles] = await Promise.all([
      InvitationRepository.findUsersByIds(rows.map((r) => r.invitedBy)),
      InvitationRepository.findRolesByIds(rows.map((r) => r.roleId)),
    ]);
    const userById = new Map(users.map((u) => [u.id, u]));
    const roleById = new Map(roles.map((r) => [r.id, r]));

    const items = rows
      .map((inv) => {
        const inviter = userById.get(inv.invitedBy);
        const role = roleById.get(inv.roleId);
        if (!inviter || !role) {
          return null;
        }
        return {
          id: inv.id,
          workspace_id: inv.workspaceId,
          project_id: inv.projectId,
          email: inv.email,
          role: toRole(role),
          status: inv.status,
          invited_by: { id: inviter.id, name: inviter.name },
          expires_at: inv.expiresAt,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      items,
      pagination: buildPaginationMeta(query.page, query.limit, total),
    };
  },

  async acceptInvitation(token: string, userId: string) {
    const invitation = await InvitationRepository.findByToken(token);
    if (!invitation) {
      throw new NotFoundError(
        'Token undangan tidak ditemukan',
        'INVITATION_INVALID',
      );
    }
    if (invitation.status === 'EXPIRED' || isExpired(invitation)) {
      if (invitation.status === 'PENDING') {
        await InvitationRepository.updateInvitationStatus(
          invitation.id,
          'EXPIRED',
        );
      }
      throw new BadRequestError(
        'Undangan sudah kedaluwarsa',
        'INVITATION_EXPIRED',
      );
    }
    if (
      invitation.status === 'ACCEPTED' ||
      invitation.status === 'DECLINED'
    ) {
      throw new InvariantError(
        'Undangan sudah diterima atau ditolak sebelumnya',
        'RESOURCE_CONFLICT',
      );
    }

    const user = await InvitationRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User tidak ditemukan', 'USER_NOT_FOUND');
    }
    if (user.email !== invitation.email) {
      throw new AuthorizationError(
        'Email pengguna login tidak sama dengan email undangan',
        'FORBIDDEN',
      );
    }

    // Membership + penanda ACCEPTED harus atomik. Bila user sudah
    // menjadi anggota lewat jalur lain, membership tidak dibuat
    // ganda (UNIQUE workspace_id + user_id / project_id + user_id).
    //
    // Undangan proyek (project_id terisi) HANYA membuat anggota
    // proyek di `project_members` — penerima TIDAK menjadi anggota
    // workspace. Undangan workspace membuat anggota workspace.
    await db.transaction(async (tx) => {
      if (invitation.projectId) {
        const existing = await InvitationRepository.findProjectMembership(
          invitation.projectId,
          userId,
        );
        if (!existing) {
          await InvitationRepository.createProjectMembership(
            {
              projectId: invitation.projectId,
              userId,
              roleId: invitation.roleId,
            },
            tx.orm,
          );
        }
      } else {
        const existing = await InvitationRepository.findMembership(
          invitation.workspaceId,
          userId,
        );
        if (!existing) {
          await InvitationRepository.createMembership(
            {
              workspaceId: invitation.workspaceId,
              userId,
              roleId: invitation.roleId,
            },
            tx.orm,
          );
        }
      }
      await InvitationRepository.updateInvitationStatus(
        invitation.id,
        'ACCEPTED',
        tx.orm,
      );
    });

    const [workspace, project, role] = await Promise.all([
      InvitationRepository.findWorkspaceById(invitation.workspaceId),
      invitation.projectId
        ? InvitationRepository.findProjectById(invitation.projectId)
        : Promise.resolve(null),
      InvitationRepository.findRoleById(invitation.roleId),
    ]);
    if (!workspace || !role) {
      throw new NotFoundError('Undangan tidak valid', 'INVITATION_INVALID');
    }
    return {
      workspace: { id: workspace.id, name: workspace.name },
      project: project ? { id: project.id, name: project.name } : null,
      role: toRole(role),
    };
  },

  async declineInvitation(token: string, userId: string) {
    const invitation = await InvitationRepository.findByToken(token);
    if (!invitation) {
      throw new NotFoundError(
        'Token undangan tidak ditemukan',
        'INVITATION_INVALID',
      );
    }
    if (invitation.status === 'EXPIRED' || isExpired(invitation)) {
      if (invitation.status === 'PENDING') {
        await InvitationRepository.updateInvitationStatus(
          invitation.id,
          'EXPIRED',
        );
      }
      throw new BadRequestError(
        'Undangan sudah kedaluwarsa',
        'INVITATION_EXPIRED',
      );
    }
    if (
      invitation.status === 'ACCEPTED' ||
      invitation.status === 'DECLINED'
    ) {
      throw new InvariantError(
        'Undangan sudah diterima atau ditolak sebelumnya',
        'RESOURCE_CONFLICT',
      );
    }

    const user = await InvitationRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User tidak ditemukan', 'USER_NOT_FOUND');
    }
    if (user.email !== invitation.email) {
      throw new AuthorizationError(
        'Email pengguna login tidak sama dengan email undangan',
        'FORBIDDEN',
      );
    }

    await InvitationRepository.updateInvitationStatus(
      invitation.id,
      'DECLINED',
    );
    return { id: invitation.id, status: 'DECLINED' };
  },

  async resendInvitation(invitationId: string, userId: string) {
    const invitation = await InvitationRepository.findById(invitationId);
    if (!invitation) {
      throw new NotFoundError('Undangan tidak ditemukan', 'INVITATION_INVALID');
    }

    // Izin member.invite dicek terhadap workspace milik undangan
    // (route ini tidak membawa :id workspace di path).
    await checkWorkspacePermission(
      userId,
      invitation.workspaceId,
      'member.invite',
    );

    if (invitation.status !== 'PENDING') {
      throw new InvariantError(
        'Hanya undangan berstatus PENDING yang dapat dikirim ulang',
        'RESOURCE_CONFLICT',
      );
    }

    // Kirim ulang = baris baru (token + expires_at baru), baris lama
    // ditandai EXPIRED (spec §11.5).
    const token = nanoid(48);
    const expiresAt = newExpiryIso();
    const created = await db.transaction(async (tx) => {
      await InvitationRepository.updateInvitationStatus(
        invitation.id,
        'EXPIRED',
        tx.orm,
      );
      return InvitationRepository.createInvitation(
        {
          workspaceId: invitation.workspaceId,
          projectId: invitation.projectId,
          email: invitation.email,
          roleId: invitation.roleId,
          invitedBy: invitation.invitedBy,
          token,
          expiresAt,
        },
        tx.orm,
      );
    });

    // Kirim ulang lewat email (best-effort, sama seperti create).
    const [workspace, role, project] = await Promise.all([
      InvitationRepository.findWorkspaceById(invitation.workspaceId),
      InvitationRepository.findRoleById(invitation.roleId),
      invitation.projectId
        ? InvitationRepository.findProjectById(invitation.projectId)
        : Promise.resolve(null),
    ]);
    await sendInvitationEmailBestEffort({
      to: invitation.email,
      workspaceName: workspace?.name ?? invitation.workspaceId,
      roleName: role?.name ?? invitation.roleId,
      projectName: project?.name ?? null,
      token,
      expiresAt,
    });

    return {
      id: created.id,
      email: created.email,
      status: created.status,
      expires_at: created.expiresAt,
    };
  },
};
