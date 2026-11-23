import type { PageId } from '../../interfaces/types';
import { btnClass, btnRedClass } from '../ui/UiClasses';

const PAGE_TITLES: Record<PageId, { title: string; sub: string }> = {
  dashboard: { title: 'Dashboard', sub: 'Ringkasan progres & analitik' },
  projects: { title: 'Project', sub: 'Kelola project dan progresnya' },
  tasks: { title: 'Daftar Tugas', sub: 'Cari, filter, dan kelola tugas' },
  taskDetail: { title: 'Detail Tugas', sub: 'Status, subtugas, lampiran, riwayat' },
  delegation: { title: 'Delegasi Tugas', sub: 'Delegasi berjenjang ke divisi & anggota' },
  organization: { title: 'Organisasi', sub: 'Divisi, anggota, dan role (RBAC)' },
  myTasks: { title: 'Tugas Saya', sub: 'Tugas yang ditugaskan ke kamu' },
  workspace: { title: 'Workspace', sub: 'Workspace, bidang usaha & saran proyek' },
  login: { title: 'Masuk', sub: 'Masuk ke AmbaDo' },
  register: { title: 'Daftar', sub: 'Buat akun AmbaDo' },
};

export function Topbar({
  page,
  theme,
  onToggleTheme,
  workspaceName,
  roleLabel,
  onLogout,
}: {
  page: PageId;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  /** Nama workspace aktif dari API (langkah 2); null bila belum ada. */
  workspaceName?: string | null;
  /** Label role user di workspace aktif dari API; null bila belum ada. */
  roleLabel?: string | null;
  onLogout: () => void;
}) {
  const meta = PAGE_TITLES[page];

  return (
    <div className="flex items-center gap-3 flex-wrap mb-5">
      <div>
        <h1 className="font-black text-[26px] uppercase m-0">{meta.title}</h1>
        <p className="font-mk-mono text-[11px] tracking-[0.14em] text-mk-muted dark:text-[#a3a3a3] uppercase mt-0.5">{meta.sub}</p>
      </div>
      <div className="flex-1" />
      {workspaceName && (
        <div className="flex flex-col gap-1.5 flex-none">
          <span className="font-mk-mono text-[10px] tracking-[0.18em] uppercase text-mk-muted dark:text-[#a3a3a3]">Workspace Aktif</span>
          <span className="font-bold">
            {workspaceName}
            {roleLabel ? ` · ${roleLabel}` : ''}
          </span>
        </div>
      )}
      {/* Sidebar disembunyikan di layar kecil (hidden lg:flex), jadi
          tombol tema + keluar tetap tersedia di sini khusus layar kecil.
          Di desktop kedua tombol itu ada di bawah sidebar. */}
      <div className="flex gap-2 lg:hidden">
        <button type="button" className={btnClass} onClick={onToggleTheme}>
          {theme === 'dark' ? 'LIGHT' : 'DARK'}
        </button>
        <button type="button" className={btnRedClass} onClick={onLogout}>
          Keluar
        </button>
      </div>
    </div>
  );
}
