import { nanoid } from 'nanoid';
import type { Varchar } from '@prisma/orm-postgres/target/codec-types';
import type { Scalars } from '@prisma/orm-postgres/family-contract/types';
import type { Models } from '../../../../prisma/contract';
import { db } from '../../../../prisma/db';

/**
 * Nilai kolom `VarChar(n)` di ORM Prisma 8 adalah string dengan
 * "brand" compile-time (`Varchar<n>`), jadi string biasa tidak bisa
 * langsung dipakai di `.eq()` / `.create()` / `.update()`.
 * Helper ini mengubah string menjadi `Varchar<n>`; saat runtime
 * nilainya tetap string biasa. Panjang sudah divalidasi Zod (max)
 * dan ditegakkan PostgreSQL.
 */
function varchar<N extends number>(value: string): Varchar<N> {
  return value as Varchar<N>;
}

/**
 * Baris yang dikembalikan ORM untuk model-model auth:
 * `Scalars<M>` = model tanpa relasi (lihat skill prisma-8, queries.md).
 */
export type UserRow = Scalars<Models.public_Users>;
export type InvitationRow = Scalars<Models.public_Invitations>;
export type MembershipRow = Scalars<Models.public_WorkspaceMemberships>;

interface AuthenticationRepositoryShape {
  findByEmail(email: string): Promise<UserRow | null>;
  findByGoogleId(googleId: string): Promise<UserRow | null>;
  findById(id: string): Promise<UserRow | null>;
  createUser(data: {
    name: string;
    email: string;
    password: string | null;
    googleId: string | null;
    authProvider: string;
  }): Promise<UserRow>;
  linkGoogleAccount(userId: string, googleId: string): Promise<UserRow | null>;
  findPendingInvitationsByEmail(email: string): Promise<InvitationRow[]>;
  findMembership(
    workspaceId: string,
    userId: string,
  ): Promise<MembershipRow | null>;
  createMembership(data: {
    workspaceId: string;
    userId: string;
    roleId: string;
  }): Promise<MembershipRow>;
  acceptInvitation(invitationId: string): Promise<InvitationRow | null>;
}

/**
 * Akses data auth lewat ORM Prisma 8 (pola openjob: repository
 * adalah satu-satunya tempat yang menyentuh database).
 *
 * ID dibuat dengan nanoid() (21 karakter, muat di VARCHAR(26)).
 * `created_at` / `updated_at` diisi default NOW() oleh database.
 */
export const AuthenticationRepository: AuthenticationRepositoryShape = {
  findByEmail(email: string) {
    return db.orm.public.Users.where((u) =>
      u.email.eq(varchar<255>(email)),
    ).first();
  },

  findByGoogleId(googleId: string) {
    return db.orm.public.Users.where((u) =>
      u.googleId.eq(varchar<255>(googleId)),
    ).first();
  },

  findById(id: string) {
    return db.orm.public.Users.where((u) =>
      u.id.eq(varchar<26>(id)),
    ).first();
  },

  createUser(data: {
    name: string;
    email: string;
    password: string | null;
    googleId: string | null;
    authProvider: string;
  }) {
    return db.orm.public.Users.create({
      id: varchar<26>(nanoid()),
      name: varchar<100>(data.name),
      email: varchar<255>(data.email),
      password: data.password === null ? null : varchar<255>(data.password),
      googleId: data.googleId === null ? null : varchar<255>(data.googleId),
      authProvider: varchar<10>(data.authProvider),
    });
  },

  linkGoogleAccount(userId: string, googleId: string) {
    return db.orm.public.Users.where((u) =>
      u.id.eq(varchar<26>(userId)),
    ).update({
      googleId: varchar<255>(googleId),
    });
  },

  async findPendingInvitationsByEmail(
    email: string,
  ): Promise<InvitationRow[]> {
    // `.all()` mengembalikan AsyncIterableResult (bukan Promise),
    // jadi di-await di sini agar service menerima array biasa.
    const rows = await db.orm.public.Invitations.where((i) =>
      i.email.eq(varchar<255>(email)),
    )
      .where((i) => i.status.eq(varchar<20>('PENDING')))
      .all();
    return rows;
  },

  findMembership(workspaceId: string, userId: string) {
    return db.orm.public.WorkspaceMemberships.where((m) =>
      m.workspaceId.eq(varchar<26>(workspaceId)),
    )
      .where((m) => m.userId.eq(varchar<26>(userId)))
      .first();
  },

  createMembership(data: {
    workspaceId: string;
    userId: string;
    roleId: string;
  }) {
    return db.orm.public.WorkspaceMemberships.create({
      id: varchar<26>(nanoid()),
      workspaceId: varchar<26>(data.workspaceId),
      userId: varchar<26>(data.userId),
      roleId: varchar<26>(data.roleId),
    });
  },

  acceptInvitation(invitationId: string) {
    return db.orm.public.Invitations.where((i) =>
      i.id.eq(varchar<26>(invitationId)),
    ).update({
      status: varchar<20>('ACCEPTED'),
    });
  },
};
