import { UserRepository } from '../repositories/user-repository';
import { getRolePermissions } from '../../../middlewares/authorize';
import {
  AuthorizationError,
  NotFoundError,
} from '../../../exceptions/index';

/**
 * Detail user (spec v2 §7.1). Pemanggil dan user yang dituju
 * harus berbagi minimal satu workspace; bila tidak, 404
 * USER_NOT_FOUND agar keberadaan user tidak bocor. Daftar
 * `workspaces` hanya berisi workspace bersama (bukan semua
 * workspace milik user yang dituju) beserta role-nya di sana.
 * Pemanggil butuh izin `member.view` di salah satu workspace
 * bersama — MEMBER tidak memilikinya (spec §2.2), sehingga
 * MEMBER mendapat 403 FORBIDDEN.
 */
export const UserService = {
  async getUserDetail(callerId: string, targetId: string) {
    const target = await UserRepository.findUserById(targetId);
    if (!target) {
      throw new NotFoundError('User tidak ditemukan', 'USER_NOT_FOUND');
    }

    const [callerMemberships, targetMemberships] = await Promise.all([
      UserRepository.findMembershipsByUserId(callerId),
      UserRepository.findMembershipsByUserId(targetId),
    ]);

    const targetWorkspaceIds = new Set(
      targetMemberships.map((m) => m.workspaceId),
    );
    const sharedMemberships = callerMemberships.filter((m) =>
      targetWorkspaceIds.has(m.workspaceId),
    );
    if (sharedMemberships.length === 0) {
      throw new NotFoundError('User tidak ditemukan', 'USER_NOT_FOUND');
    }

    // Izin member.view di salah satu workspace bersama.
    let allowed = false;
    for (const membership of sharedMemberships) {
      const role = await getRolePermissions(membership.roleId);
      if (role.permissions.includes('member.view')) {
        allowed = true;
        break;
      }
    }
    if (!allowed) {
      throw new AuthorizationError(
        'Tidak memiliki permission',
        'FORBIDDEN',
      );
    }

    const sharedWorkspaceIds = sharedMemberships.map((m) => m.workspaceId);
    const [workspaces, roles] = await Promise.all([
      UserRepository.findWorkspacesByIds(sharedWorkspaceIds),
      UserRepository.findRolesByIds(
        targetMemberships
          .filter((m) => sharedWorkspaceIds.includes(m.workspaceId))
          .map((m) => m.roleId),
      ),
    ]);
    const workspaceById = new Map(workspaces.map((w) => [w.id, w]));
    const roleById = new Map(roles.map((r) => [r.id, r]));
    const targetMembershipByWorkspace = new Map(
      targetMemberships.map((m) => [m.workspaceId, m]),
    );

    return {
      id: target.id,
      name: target.name,
      email: target.email,
      auth_provider: target.authProvider,
      onboarding_completed: target.onboardingCompleted,
      workspaces: sharedWorkspaceIds
        .map((workspaceId) => {
          const workspace = workspaceById.get(workspaceId);
          const membership = targetMembershipByWorkspace.get(workspaceId);
          const role = membership
            ? roleById.get(membership.roleId)
            : undefined;
          if (!workspace || !role) {
            return null;
          }
          return {
            id: workspace.id,
            name: workspace.name,
            role: {
              id: role.id,
              name: role.name,
              is_system: role.isSystem,
            },
          };
        })
        .filter(
          (w): w is NonNullable<typeof w> => w !== null,
        ),
    };
  },
};
