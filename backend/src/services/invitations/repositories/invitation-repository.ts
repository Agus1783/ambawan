import { nanoid } from 'nanoid';
import { and } from '@prisma/orm-postgres/orm-client';
import type { TimestamptzString } from '@prisma/orm-postgres/target/codec-types';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import type { Models } from '../../../../prisma/contract';
import { db } from '../../../../prisma/db';
import { varchar } from '../../../utils/varchar';

export type InvitationRow = Scalars<Models.public_Invitations>;
export type InvitationRoleRow = Scalars<Models.public_WorkspaceRoles>;
export type InvitationUserRow = Scalars<Models.public_Users>;
export type InvitationWorkspaceRow = Scalars<Models.public_Workspaces>;
export type InvitationProjectRow = Scalars<Models.public_Projects>;
export type InvitationMembershipRow =
  Scalars<Models.public_WorkspaceMemberships>;
export type ProjectMembershipRow = Scalars<Models.public_ProjectMembers>;

export type OrmClient = typeof db.orm;

/** `TimestamptzString` juga branded seperti `Varchar` — string ISO
 *  biasa harus di-cast sebelum dipakai di `.create()`. */
export function timestamptz(value: string): TimestamptzString {
  return value as TimestamptzString;
}

function invitationsFiltered(
  workspaceId: string,
  opts: { status?: string | undefined },
) {
  return db.orm.public.Invitations.where((i) => {
    const preds = [i.workspaceId.eq(varchar<26>(workspaceId))];
    if (opts.status) {
      preds.push(i.status.eq(varchar<20>(opts.status)));
    }
    return and(...preds);
  });
}

export const InvitationRepository = {
  findByToken(token: string) {
    return db.orm.public.Invitations.where((i) =>
      i.token.eq(varchar<64>(token)),
    ).first();
  },

  findById(id: string) {
    return db.orm.public.Invitations.where((i) =>
      i.id.eq(varchar<26>(id)),
    ).first();
  },

  findUserByEmail(email: string) {
    return db.orm.public.Users.where((u) =>
      u.email.eq(varchar<255>(email)),
    ).first();
  },

  findUserById(id: string) {
    return db.orm.public.Users.where((u) =>
      u.id.eq(varchar<26>(id)),
    ).first();
  },

  async findUsersByIds(ids: string[]): Promise<InvitationUserRow[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await db.orm.public.Users.where((u) =>
      u.id.in(ids.map((id) => varchar<26>(id))),
    ).all();
    return rows;
  },

  findMembership(workspaceId: string, userId: string) {
    return db.orm.public.WorkspaceMemberships.where((m) =>
      m.workspaceId.eq(varchar<26>(workspaceId)),
    )
      .where((m) => m.userId.eq(varchar<26>(userId)))
      .first();
  },

  findProjectMembership(projectId: string, userId: string) {
    return db.orm.public.ProjectMembers.where((m) =>
      m.projectId.eq(varchar<26>(projectId)),
    )
      .where((m) => m.userId.eq(varchar<26>(userId)))
      .first();
  },

  findRoleById(roleId: string) {
    return db.orm.public.WorkspaceRoles.where((r) =>
      r.id.eq(varchar<26>(roleId)),
    ).first();
  },

  async findRolesByIds(ids: string[]): Promise<InvitationRoleRow[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await db.orm.public.WorkspaceRoles.where((r) =>
      r.id.in(ids.map((id) => varchar<26>(id))),
    ).all();
    return rows;
  },

  findWorkspaceById(id: string) {
    return db.orm.public.Workspaces.where((w) =>
      w.id.eq(varchar<26>(id)),
    ).first();
  },

  findProjectById(id: string) {
    return db.orm.public.Projects.where((p) =>
      p.id.eq(varchar<26>(id)),
    ).first();
  },

  createInvitation(
    data: {
      workspaceId: string;
      projectId: string | null;
      email: string;
      roleId: string;
      invitedBy: string;
      token: string;
      expiresAt: string;
    },
    orm: OrmClient = db.orm,
  ) {
    return orm.public.Invitations.create({
      id: varchar<26>(nanoid()),
      workspaceId: varchar<26>(data.workspaceId),
      projectId:
        data.projectId === null ? null : varchar<26>(data.projectId),
      email: varchar<255>(data.email),
      roleId: varchar<26>(data.roleId),
      invitedBy: varchar<26>(data.invitedBy),
      token: varchar<64>(data.token),
      status: varchar<20>('PENDING'),
      expiresAt: timestamptz(data.expiresAt),
    });
  },

  updateInvitationStatus(
    id: string,
    status: string,
    orm: OrmClient = db.orm,
  ) {
    return orm.public.Invitations.where((i) =>
      i.id.eq(varchar<26>(id)),
    ).update({
      status: varchar<20>(status),
    });
  },

  createMembership(
    data: { workspaceId: string; userId: string; roleId: string },
    orm: OrmClient = db.orm,
  ) {
    return orm.public.WorkspaceMemberships.create({
      id: varchar<26>(nanoid()),
      workspaceId: varchar<26>(data.workspaceId),
      userId: varchar<26>(data.userId),
      roleId: varchar<26>(data.roleId),
    });
  },

  createProjectMembership(
    data: { projectId: string; userId: string; roleId: string },
    orm: OrmClient = db.orm,
  ) {
    return orm.public.ProjectMembers.create({
      id: varchar<26>(nanoid()),
      projectId: varchar<26>(data.projectId),
      userId: varchar<26>(data.userId),
      roleId: varchar<26>(data.roleId),
    });
  },

  async listInvitations(
    workspaceId: string,
    opts: { status?: string | undefined; limit: number; offset: number },
  ): Promise<InvitationRow[]> {
    const rows = await invitationsFiltered(workspaceId, opts)
      .orderBy((i) => i.createdAt.desc())
      .limit(opts.limit)
      .offset(opts.offset)
      .all();
    return rows;
  },

  async countInvitations(
    workspaceId: string,
    opts: { status?: string | undefined },
  ): Promise<number> {
    const result = await invitationsFiltered(workspaceId, opts).aggregate(
      (a) => ({ total: a.count() }),
    );
    return result.total;
  },
};
