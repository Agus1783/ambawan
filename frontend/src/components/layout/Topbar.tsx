import type { ChangeEvent } from 'react';
import type { PageId, RoleName } from '../../interfaces/types';
import { ROLE_LABELS } from '../../data/mockData';
import { btnClass } from '../ui/UiClasses';

const PAGE_TITLES: Record<PageId, { title: string; sub: string }> = {
  dashboard: { title: 'Dashboard', sub: 'Ringkasan progres & analitik' },
  projects: { title: 'Project', sub: 'Kelola project dan progresnya' },
  tasks: { title: 'Daftar Tugas', sub: 'Cari, filter, dan kelola tugas' },
  taskDetail: { title: 'Detail Tugas', sub: 'Status, subtugas, lampiran, riwayat' },
  delegation: { title: 'Delegasi Tugas', sub: 'Delegasi berjenjang ke divisi & anggota' },
  organization: { title: 'Organisasi', sub: 'Divisi, anggota, dan role (RBAC)' },
  myTasks: { title: 'Tugas Saya', sub: 'Tugas yang ditugaskan ke kamu' },
};

export function Topbar({
  page,
  theme,
  onToggleTheme,
  role,
  onRoleChange,
}: {
  page: PageId;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  role: RoleName;
  onRoleChange: (role: RoleName) => void;
}) {
  const meta = PAGE_TITLES[page];

  return (
    <div className="flex items-center gap-3 flex-wrap mb-5">
      <div>
        <h1 className="font-black text-[26px] uppercase m-0">{meta.title}</h1>
        <p className="font-mk-mono text-[11px] tracking-[0.14em] text-mk-muted dark:text-[#a3a3a3] uppercase mt-0.5">{meta.sub}</p>
      </div>
      <div className="flex-1" />
      <button type="button" className={btnClass} onClick={onToggleTheme}>
        {theme === 'dark' ? 'LIGHT' : 'DARK'}
      </button>
      <label className="flex flex-col gap-1.5 flex-none">
        <span className="font-mk-mono text-[10px] tracking-[0.18em] uppercase text-mk-muted dark:text-[#a3a3a3]">Lihat Sebagai Role</span>
        <select
          className="border-2 border-black dark:border-mk-bg rounded-lg px-3 py-2 font-bold bg-white dark:bg-[#2d2d2d] shadow-brutal-sm dark:shadow-brutal-sm-light"
          value={role}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onRoleChange(e.target.value as RoleName)}
        >
          {(Object.keys(ROLE_LABELS) as RoleName[]).map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
