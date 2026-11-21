import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import type { LoginTicket } from 'google-auth-library';
import { AuthenticationRepository } from '../repositories/auth-repository';
import type { UserRow } from '../repositories/auth-repository';
import { TokenManager } from '../../../utils/token-manager';
import {
  AuthenticationError,
  InvariantError,
  NotFoundError,
} from '../../../exceptions/index';
import type {
  GoogleInput,
  LoginInput,
  RegisterInput,
} from '../validator/schema';

/**
 * Bentuk user yang dikembalikan ke client (spec v2 §6):
 * password tidak pernah ikut, nama field snake_case.
 */
function toPublicUser(user: UserRow) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    auth_provider: user.authProvider,
    onboarding_completed: user.onboardingCompleted,
  };
}

export type PublicUser = ReturnType<typeof toPublicUser>;

async function acceptPendingInvitations(
  userId: string,
  email: string,
): Promise<void> {
  // Spec §6.1: bila email ini sudah pernah diundang ke sebuah workspace,
  // membership untuk undangan tersebut dibuat otomatis setelah register.
  // Best-effort dan sekuensial: bila langkah ini gagal, register tetap
  // berhasil (user dapat menerima undangan lewat link nanti).
  //
  // Undangan proyek (project_id terisi) hanya membuat anggota proyek
  // di `project_members` — penerima TIDAK menjadi anggota workspace.
  try {
    const invitations =
      await AuthenticationRepository.findPendingInvitationsByEmail(email);
    const now = new Date();
    for (const invitation of invitations) {
      if (new Date(invitation.expiresAt) <= now) {
        continue;
      }
      if (invitation.projectId) {
        const existing =
          await AuthenticationRepository.findProjectMembership(
            invitation.projectId,
            userId,
          );
        if (existing) {
          continue;
        }
        await AuthenticationRepository.createProjectMembership({
          projectId: invitation.projectId,
          userId,
          roleId: invitation.roleId,
        });
      } else {
        const existing = await AuthenticationRepository.findMembership(
          invitation.workspaceId,
          userId,
        );
        if (existing) {
          continue;
        }
        await AuthenticationRepository.createMembership({
          workspaceId: invitation.workspaceId,
          userId,
          roleId: invitation.roleId,
        });
      }
      await AuthenticationRepository.acceptInvitation(invitation.id);
    }
  } catch (error) {
    console.error('Gagal memproses undangan pending saat register:', error);
  }
}


export const AuthenticationService = {
  async register(input: RegisterInput): Promise<PublicUser> {
    const existing = await AuthenticationRepository.findByEmail(input.email);
    if (existing) {
      throw new InvariantError('Email sudah digunakan', 'EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await AuthenticationRepository.createUser({
      name: input.name,
      email: input.email,
      password: passwordHash,
      googleId: null,
      authProvider: 'EMAIL',
    });

    await acceptPendingInvitations(user.id, user.email);
    return toPublicUser(user);
  },

  async login(input: LoginInput): Promise<{
    user: PublicUser;
    accessToken: string;
  }> {
    const user = await AuthenticationRepository.findByEmail(input.email);
    if (!user || !user.password) {
      // Akun Google (password NULL) juga masuk sini: harus login via Google.
      throw new AuthenticationError(
        'Email atau password salah',
        'INVALID_CREDENTIALS',
      );
    }

    const passwordMatch = await bcrypt.compare(input.password, user.password);
    if (!passwordMatch) {
      throw new AuthenticationError(
        'Email atau password salah',
        'INVALID_CREDENTIALS',
      );
    }

    const accessToken = TokenManager.generateAccessToken({ sub: user.id });
    return { user: toPublicUser(user), accessToken };
  },

  async getMe(userId: string): Promise<PublicUser> {
    const user = await AuthenticationRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User tidak ditemukan', 'USER_NOT_FOUND');
    }
    return toPublicUser(user);
  },

  async loginWithGoogle(input: GoogleInput): Promise<{
    user: PublicUser;
    accessToken: string;
    isNewUser: boolean;
  }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('Environment variable GOOGLE_CLIENT_ID belum diisi');
    }

    const client = new OAuth2Client(clientId);
    let ticket: LoginTicket;
    try {
      ticket = await client.verifyIdToken({
        idToken: input.id_token,
        audience: clientId,
      });
    } catch {
      throw new AuthenticationError(
        'Token Google tidak valid',
        'GOOGLE_AUTH_FAILED',
      );
    }

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new AuthenticationError(
        'Token Google tidak valid',
        'GOOGLE_AUTH_FAILED',
      );
    }

    // Aturan pencocokan (spec §6.5):
    // 1. google_id sudah terdaftar -> login sebagai user tersebut.
    const byGoogleId = await AuthenticationRepository.findByGoogleId(
      payload.sub,
    );
    if (byGoogleId) {
      return {
        user: toPublicUser(byGoogleId),
        accessToken: TokenManager.generateAccessToken({ sub: byGoogleId.id }),
        isNewUser: false,
      };
    }

    // 2. Email sudah terdaftar -> tautkan google_id ke akun yang ada
    // (auth_provider tetap seperti semula, mis. EMAIL).
    const byEmail = await AuthenticationRepository.findByEmail(payload.email);
    if (byEmail) {
      await AuthenticationRepository.linkGoogleAccount(byEmail.id, payload.sub);
      const user = await AuthenticationRepository.findById(byEmail.id);
      if (!user) {
        throw new NotFoundError('User tidak ditemukan', 'USER_NOT_FOUND');
      }
      return {
        user: toPublicUser(user),
        accessToken: TokenManager.generateAccessToken({ sub: user.id }),
        isNewUser: false,
      };
    }

    // 3. Email belum terdaftar -> user baru, auth_provider GOOGLE,
    // tanpa password. Diarahkan ke onboarding untuk membuat workspace.
    const user = await AuthenticationRepository.createUser({
      name: payload.name ?? payload.email.split('@')[0] ?? 'Pengguna Google',
      email: payload.email,
      password: null,
      googleId: payload.sub,
      authProvider: 'GOOGLE',
    });
    return {
      user: toPublicUser(user),
      accessToken: TokenManager.generateAccessToken({ sub: user.id }),
      isNewUser: true,
    };
  },
};
