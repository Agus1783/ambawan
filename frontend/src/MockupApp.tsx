import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { Project, RoleName, Task, TaskStatus } from './data/mockData';
import { CURRENT_USER_ID, ROLE_LABELS, projects as seedProjects, tasks as seedTasks, userName } from './data/mockData';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { TasksPage } from './pages/TasksPage';
import { TaskDetailPage } from './pages/TaskDetailPage';
import { DelegationPage } from './pages/DelegationPage';
import { OrganizationPage } from './pages/OrganizationPage';
import { MyTasksPage } from './pages/MyTasksPage';
import { btnClass } from './components/mockup/UiClasses';

export type PageId = 'dashboard' | 'projects' | 'tasks' | 'taskDetail' | 'delegation' | 'organization' | 'myTasks';

const NAV: { id: PageId; label: string; roles: RoleName[] }[] = [
  { id: 'dashboard', label: 'Dashboard', roles: ['ADMIN', 'MANAGER', 'DIVISION_LEADER', 'MEMBER'] },
  { id: 'projects', label: 'Project', roles: ['ADMIN', 'MANAGER'] },
  { id: 'tasks', label: 'Daftar Tugas', roles: ['ADMIN', 'MANAGER', 'DIVISION_LEADER', 'MEMBER'] },
  { id: 'delegation', label: 'Delegasi', roles: ['ADMIN', 'MANAGER', 'DIVISION_LEADER'] },
  { id: 'organization', label: 'Organisasi', roles: ['ADMIN'] },
  { id: 'myTasks', label: 'Tugas Saya', roles: ['ADMIN', 'MANAGER', 'DIVISION_LEADER', 'MEMBER'] },
];

const PAGE_TITLES: Record<PageId, { title: string; sub: string }> = {
  dashboard: { title: 'Dashboard', sub: 'Ringkasan progres & analitik' },
  projects: { title: 'Project', sub: 'Kelola project dan progresnya' },
  tasks: { title: 'Daftar Tugas', sub: 'Cari, filter, dan kelola tugas' },
  taskDetail: { title: 'Detail Tugas', sub: 'Status, subtugas, lampiran, riwayat' },
  delegation: { title: 'Delegasi Tugas', sub: 'Delegasi berjenjang ke divisi & anggota' },
  organization: { title: 'Organisasi', sub: 'Divisi, anggota, dan role (RBAC)' },
  myTasks: { title: 'Tugas Saya', sub: 'Tugas yang ditugaskan ke kamu' },
};

function MockupApp() {
  const [page, setPage] = useState<PageId>('dashboard');
  const [role, setRole] = useState<RoleName>('MANAGER');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem('ambado-theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ambado-theme', theme);
    } catch {
      // Abaikan kalau storage tidak tersedia (mode privat dsb).
    }
  }, [theme]);
  const [taskList, setTaskList] = useState<Task[]>(seedTasks);
  const [projectList, setProjectList] = useState<Project[]>(seedProjects);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string[]>>({
    tsk_01: ['Progress sudah 70%, API login hampir selesai.'],
  });

  const navigate = (next: PageId) => setPage(next);

  const openTaskDetail = (id: string) => {
    setSelectedTaskId(id);
    setPage('taskDetail');
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTaskList((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const delegateTask = (taskId: string, assigneeId: string) => {
    setTaskList((prev) => prev.map((t) => (t.id === taskId ? { ...t, assigneeId, status: 'ASSIGNED' as TaskStatus } : t)));
  };

  const selectedTask = taskList.find((t) => t.id === selectedTaskId) ?? null;
  const meta = PAGE_TITLES[page];

  return (
    <div className={`min-h-screen bg-mk-bg text-black text-sm dark:bg-[#171717] dark:text-mk-bg ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="flex min-h-screen">
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
                // className={`text-left border-2 border-black rounded-lg px-3 py-2.5 font-bold shadow-[2px_2px_0_#111] hover:bg-mk-yellow-soft ${page === n.id || (n.id === 'tasks' && page === 'taskDetail') ? 'bg-mk-yellow' : 'bg-white'}`}
                onClick={() => navigate(n.id)}
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

        <main className="flex-1 px-6 py-5 pb-10 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-5">
            <div>
              <h1 className="font-black text-[26px] uppercase m-0">{meta.title}</h1>
              <p className="font-mk-mono text-[11px] tracking-[0.14em] text-mk-muted dark:text-[#a3a3a3] uppercase mt-0.5">{meta.sub}</p>
              {/*<p className="font-mk-mono text-[11px] tracking-[0.14em] text-mk-muted uppercase mt-0.5">{meta.sub}</p>*/}
            </div>
            <div className="flex-1" />
            <button type="button" className={btnClass} onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>
              {theme === 'dark' ? 'LIGHT' : 'DARK'}
            </button>
            <label className="flex flex-col gap-1.5 flex-none">
              <span className="font-mk-mono text-[10px] tracking-[0.18em] uppercase text-mk-muted">Lihat Sebagai Role</span>
              <select
                className="border-2 border-black rounded-lg px-3 py-2 font-bold bg-white shadow-brutal-sm"
                value={role}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setRole(e.target.value as RoleName)}
              >
                {(Object.keys(ROLE_LABELS) as RoleName[]).map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </label>
          </div>

          {page === 'dashboard' && <DashboardPage tasks={taskList} />}
          {page === 'projects' && (
            <ProjectsPage
              projects={projectList}
              tasks={taskList}
              onAddProject={(p) => setProjectList((prev) => [...prev, p])}
              onDeleteProject={(id) => setProjectList((prev) => prev.filter((p) => p.id !== id))}
            />
          )}
          {page === 'tasks' && (
            <TasksPage
              tasks={taskList}
              projects={projectList}
              role={role}
              onSelectTask={openTaskDetail}
              onAddTask={(t) => setTaskList((prev) => [t, ...prev])}
            />
          )}

          {page === 'taskDetail' && selectedTask && (
            <TaskDetailPage
              task={selectedTask}
              tasks={taskList}
              onBack={() => navigate('tasks')}
              onUpdateStatus={updateTaskStatus}
              comments={comments[selectedTask.id] ?? []}
              onAddComment={(text) =>
                setComments((prev) => ({ ...prev, [selectedTask.id]: [...(prev[selectedTask.id] ?? []), text] }))
              }
            />
          )}
          {page === 'taskDetail' && !selectedTask && <p className="text-mk-muted">Pilih task dulu dari Daftar Task.</p>}
          {page === 'delegation' && <DelegationPage tasks={taskList} onDelegate={delegateTask} />}
          {page === 'organization' && <OrganizationPage />}
          {page === 'myTasks' && <MyTasksPage tasks={taskList} onUpdateStatus={updateTaskStatus} />}
        </main>
      </div>
    </div>
  );
}

export default MockupApp;
