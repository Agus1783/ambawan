import { db } from '../../prisma/db';
import { varchar } from './varchar';

/**
 * Dipakai GET /permissions,
 * validasi role kustom, dan seed role bawaan sistem.
 */
export const PERMISSION_CATALOG: ReadonlyArray<{
  permission: string;
  description: string;
}> = [
  { permission: 'workspace.view', description: 'Melihat detail workspace' },
  { permission: 'workspace.update', description: 'Mengubah workspace' },
  { permission: 'workspace.delete', description: 'Menghapus workspace' },
  {
    permission: 'workspace.manage_divisions',
    description: 'Membuat, mengubah, menghapus divisi dan menentukan ketua divisi',
  },
  {
    permission: 'workspace.manage_templates',
    description: 'Membuat, mengubah, menghapus template proyek dan template tugas',
  },
  {
    permission: 'workspace.manage_industries',
    description: 'Menambah bidang usaha',
  },
  {
    permission: 'member.invite',
    description: 'Mengundang pengguna ke workspace atau proyek',
  },
  {
    permission: 'member.manage',
    description: 'Mengubah role anggota, mengeluarkan anggota, dan mengelola role kustom',
  },
  {
    permission: 'member.view',
    description: 'Melihat daftar dan detail anggota workspace',
  },
  { permission: 'project.create', description: 'Membuat project' },
  { permission: 'project.update', description: 'Mengubah project' },
  { permission: 'project.delete', description: 'Menghapus project' },
  { permission: 'project.view', description: 'Melihat project' },
  { permission: 'task.create', description: 'Membuat task' },
  { permission: 'task.update', description: 'Mengubah task' },
  { permission: 'task.delete', description: 'Menghapus task' },
  { permission: 'task.delegate', description: 'Mendelegasikan task' },
  { permission: 'task.update_status', description: 'Mengubah status task' },
  { permission: 'task.view', description: 'Melihat task' },
  { permission: 'attachment.upload', description: 'Mengunggah attachment' },
  { permission: 'attachment.delete', description: 'Menghapus attachment' },
  { permission: 'comment.create', description: 'Menulis komentar pada task' },
  { permission: 'dashboard.view', description: 'Melihat dashboard' },
  { permission: 'analytics.view', description: 'Melihat analitik dan statistik task' },
  { permission: 'history.view', description: 'Melihat task history' },
];

export const PERMISSION_SET: ReadonlySet<string> = new Set(
  PERMISSION_CATALOG.map((p) => p.permission),
);

export async function hasPermissionAnywhere(
  userId: string,
  permission: string,
): Promise<boolean> {
  const memberships = await db.orm.public.WorkspaceMemberships.where((m) =>
    m.userId.eq(varchar<26>(userId)),
  ).all();
  if (memberships.length === 0) {
    return false;
  }

  const roleIds = [...new Set(memberships.map((m) => m.roleId))];
  const rows = await db.orm.public.RolePermissions.where((p) =>
    p.roleId.in(roleIds),
  ).all();
  return rows.some((row) => row.permission === permission);
}
