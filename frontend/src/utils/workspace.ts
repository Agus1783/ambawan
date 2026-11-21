/**
 * Workspace aktif + role dari API (Tahap 2 langkah 2).
 *
 * - Workspace aktif disimpan di localStorage kunci `activeWorkspaceId`
 *   supaya pilihan bertahan setelah refresh.
 * - Role gating halaman (Sidebar, TasksPage) memakai `RoleName` lama;
 *   nama role dari API dipetakan ke sana, dan nama role kustom yang
 *   tidak dikenal jatuh ke 'MEMBER' (paling rendah) untuk gating,
 *   sementara label tampilannya tetap memakai nama aslinya.
 */

import type { RoleName } from '../interfaces/types';
import type { Workspace } from './api';
import { ROLE_LABELS } from '../data/mockData';

const ACTIVE_WORKSPACE_KEY = 'activeWorkspaceId';

/** Baca id workspace aktif yang tersimpan, atau `null` bila belum ada. */
export function readActiveWorkspaceId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_WORKSPACE_KEY);
  } catch {
    return null;
  }
}

/** Simpan id workspace aktif; `null` menghapus pilihan tersimpan. */
export function saveActiveWorkspaceId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
    }
  } catch {
    // Penyimpanan tidak tersedia: pilihan aktif cukup di memori.
  }
}

/**
 * Tentukan workspace aktif dari daftar: pakai id tersimpan bila masih
 * ada di daftar, kalau tidak pakai workspace pertama, kalau tidak ada
 * workspace sama sekali kembalikan `null`.
 */
export function resolveActiveWorkspaceId(
  workspaces: Workspace[],
  savedId: string | null,
): string | null {
  if (savedId && workspaces.some((w) => w.id === savedId)) {
    return savedId;
  }
  return workspaces[0]?.id ?? null;
}

/** Petakan nama role dari API ke `RoleName` untuk gating halaman. */
export function roleNameToGateRole(apiRoleName: string): RoleName {
  if (
    apiRoleName === 'ADMIN' ||
    apiRoleName === 'MANAGER' ||
    apiRoleName === 'DIVISION_LEADER' ||
    apiRoleName === 'MEMBER' ||
    apiRoleName === 'OWNER'
  ) {
    return apiRoleName;
  }
  return 'MEMBER';
}

/** Label role untuk ditampilkan: role sistem pakai label Indonesia, role kustom tampil apa adanya. */
export function labelRoleApi(apiRoleName: string): string {
  return (ROLE_LABELS as Record<string, string>)[apiRoleName] ?? apiRoleName;
}
