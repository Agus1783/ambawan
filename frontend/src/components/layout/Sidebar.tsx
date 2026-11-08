import type { PageId, RoleName } from '../../interfaces/types';
import { CURRENT_USER_ID, ROLE_LABELS } from '../../data/mockData';
import { userName } from '../../utils/helpers';

const NAV: { id: PageId; label: string; roles: RoleName[] }[] = [
  { id: 'dashboard', label: 'Dashboard', roles: ['ADMIN', 'MANAGER', 'DIVISION_LEADER', 'MEMBER'] },
  { id: 'projects', label: 'Project', roles: ['ADMIN', 'MANAGER'] },
  { id: 'tasks', label: 'Daftar Tugas', roles: ['ADMIN', 'MANAGER', 'DIVISION_LEADER', 'MEMBER'] },
  { id: 'delegation', label: 'Delegasi', roles: ['ADMIN', 'MANAGER', 'DIVISION_LEADER'] },
  { id: 'organization', label: 'Organisasi', roles: ['ADMIN'] },
  { id: 'myTasks', label: 'Tugas Saya', roles: ['ADMIN', 'MANAGER', 'DIVISION_LEADER', 'MEMBER'] },
];

export function Sidebar({
  page,
  role,
  onNavigate,
}: {
  page: PageId;
  role: RoleName;
  onNavigate: (page: PageId) => void;
}) {
  return (
    <aside className="hidden lg:flex w-65 shrink-0 flex-col gap-5 bg-white dark:bg-[#262626] border-r-[3px] border-black dark:border-mk-bg p-5 sticky top-0 h-screen">
      <div className="flex items-center gap-2.5">
        <div className="w-11 h-11 bg-mk-yellow border-[3px] border-black dark:border-mk-bg rounded-full flex items-center justify-center font-black text-xl shadow-brutal-sm dark:shadow-brutal-sm-light text-black">
          A
        </div>
        <div>
          <div className="font-black text-[22px] uppercase">Ambado</div>
          <div className="font-mk-mono text-[10px] tracking-[0.18em] text-mk-muted dark:text-[#a3a3a3] uppercase">Task Management</div>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        <span className="font-mk-mono text-[10px] tracking-[0.2em] text-mk-muted dark:text-[#a3a3a3] uppercase">Navigasi</span>
        {NAV.filter((n) => n.roles.includes(role)).map((n) => (
          <button
            key={n.id}
            type="button"
            className={`text-left border-2 border-black dark:border-mk-bg rounded-lg px-3 py-2.5 font-bold shadow-[2px_2px_0_#111] dark:shadow-[2px_2px_0_#f5f5f0] hover:bg-mk-yellow-soft ${page === n.id || (n.id === 'tasks' && page === 'taskDetail') ? 'bg-mk-yellow text-black' : 'bg-white dark:bg-[#2d2d2d]'}`}
            onClick={() => onNavigate(n.id)}
          >
            {n.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto border-t-2 border-dashed border-black dark:border-mk-bg pt-3">
        <div className="font-extrabold uppercase">{userName(CURRENT_USER_ID)}</div>
        <div className="font-mk-mono text-[11px] text-mk-muted dark:text-[#a3a3a3] tracking-[0.12em]">{ROLE_LABELS[role]} · MOCKUP</div>
      </div>
    </aside>
  );
}
