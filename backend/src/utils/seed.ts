import { nanoid } from 'nanoid';
import { db } from '../../prisma/db';
import { varchar } from './varchar';
import { PERMISSION_CATALOG } from './permissions';

/**
 * Seed data sistem (spec v2 §2.1, §2.2 + skema §18):
 * 7 industri sistem, 4 role bawaan sistem beserta izinnya.
 *
 * Di skema SQL, INSERT seed ini ditulis sebagai komentar — desainnya
 * memang "di-seed oleh aplikasi saat pertama kali berjalan". Modul
 * ini mewujudkannya: dipanggil saat server boot (src/server.ts)
 * dan bisa dijalankan manual lewat `pnpm seed`.
 *
 * Idempotent: baris yang sudah ada dilewati, jadi aman dijalankan
 * berulang kali. ID memakai nilai tetap dari skema (`ind_software`,
 * `role_owner`, dst.) agar cocok dengan contoh di spec.
 */
const SYSTEM_INDUSTRIES: ReadonlyArray<{
  id: string;
  name: string;
  description: string;
}> = [
  {
    id: 'ind_software',
    name: 'Software House',
    description: 'Pengembangan perangkat lunak dan layanan IT',
  },
  {
    id: 'ind_pendidikan',
    name: 'Pendidikan',
    description: 'Sekolah, kampus, dan lembaga kursus',
  },
  {
    id: 'ind_kesehatan',
    name: 'Kesehatan',
    description: 'Klinik, rumah sakit, dan layanan kesehatan',
  },
  {
    id: 'ind_retail',
    name: 'Retail',
    description: 'Toko, distribusi, dan perdagangan',
  },
  {
    id: 'ind_manufaktur',
    name: 'Manufaktur',
    description: 'Pabrik dan produksi barang',
  },
  {
    id: 'ind_jasa',
    name: 'Jasa',
    description: 'Konsultan, agensi, dan layanan profesional',
  },
  { id: 'ind_lainnya', name: 'Lainnya', description: 'Bidang usaha lain' },
];

const SYSTEM_ROLES: ReadonlyArray<{
  id: string;
  name: string;
  description: string;
  permissions: string[];
}> = [
  {
    id: 'role_owner',
    name: 'OWNER',
    description: 'Pemilik workspace/proyek',
    // OWNER punya semua 25 izin katalog.
    permissions: PERMISSION_CATALOG.map((p) => p.permission),
  },
  {
    id: 'role_manager',
    name: 'MANAGER',
    description: 'Mengelola proyek dan tugas',
    permissions: [
      'workspace.view',
      'member.view',
      'project.create',
      'project.update',
      'project.delete',
      'project.view',
      'task.create',
      'task.update',
      'task.delete',
      'task.delegate',
      'task.update_status',
      'task.view',
      'attachment.upload',
      'attachment.delete',
      'comment.create',
      'dashboard.view',
      'analytics.view',
      'history.view',
    ],
  },
  {
    id: 'role_leader',
    name: 'DIVISION_LEADER',
    description: 'Mengelola tugas dan anggota dalam divisinya',
    permissions: [
      'workspace.view',
      'member.view',
      'member.invite',
      'task.create',
      'task.update',
      'task.delete',
      'task.delegate',
      'task.update_status',
      'task.view',
      'attachment.upload',
      'attachment.delete',
      'comment.create',
      'dashboard.view',
      'history.view',
    ],
  },
  {
    id: 'role_member',
    name: 'MEMBER',
    description: 'Mengerjakan tugas yang diberikan',
    permissions: [
      'workspace.view',
      'member.view',
      'task.update_status',
      'task.view',
      'attachment.upload',
      'comment.create',
      'dashboard.view',
      'history.view',
    ],
  },
];

export async function seedSystemData(): Promise<{
  industries: number;
  roles: number;
  permissions: number;
}> {
  let industries = 0;
  let roles = 0;
  let permissions = 0;

  for (const industry of SYSTEM_INDUSTRIES) {
    const existing = await db.orm.public.Industries.where((i) =>
      i.id.eq(varchar<26>(industry.id)),
    ).first();
    if (!existing) {
      await db.orm.public.Industries.create({
        id: varchar<26>(industry.id),
        name: varchar<100>(industry.name),
        description: industry.description,
        createdBy: null,
      });
      industries += 1;
    }
  }

  for (const role of SYSTEM_ROLES) {
    const existing = await db.orm.public.WorkspaceRoles.where((r) =>
      r.id.eq(varchar<26>(role.id)),
    ).first();
    if (!existing) {
      await db.orm.public.WorkspaceRoles.create({
        id: varchar<26>(role.id),
        workspaceId: null,
        name: varchar<100>(role.name),
        description: role.description,
        isSystem: true,
        createdBy: null,
      });
      roles += 1;
    }

    const existingPermissions = await db.orm.public.RolePermissions.where(
      (p) => p.roleId.eq(varchar<26>(role.id)),
    ).all();
    const have = new Set(
      existingPermissions.map((p) => p.permission as string),
    );
    for (const permission of role.permissions) {
      if (!have.has(permission)) {
        await db.orm.public.RolePermissions.create({
          id: varchar<26>(nanoid()),
          roleId: varchar<26>(role.id),
          permission: varchar<50>(permission),
        });
        permissions += 1;
      }
    }
  }

  return { industries, roles, permissions };
}
