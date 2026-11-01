// MockupApp — entry point mockup AMBADO (versi struktur proyek).
// CARA PREVIEW (tanpa merusak App yang sudah ada):
//   1. Di frontend/src/main.tsx, ganti sementara:
//        import App from './App.tsx'
//      menjadi:
//        import App from './MockupApp.tsx'
//   2. Jalankan: pnpm dev, buka http://localhost:5173
//   3. Setelah selesai melihat, kembalikan import main.tsx.
// Kalau mockup ini disetujui tim, langkah migrasi akhirnya adalah
// menggantikan isi App.tsx dengan komponen ini (atau sebaliknya).
// File ini TIDAK di-push otomatis; kamu yang copy ke repo lokal
// lalu push sendiri lewat branch (proteksi branch aktif).
import { useState } from 'react';
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

export type PageId = 'dashboard' | 'projects' | 'tasks' | 'taskDetail' | 'delegation' | 'organization' | 'myTasks';

const NAV: { id: PageId; label: string; roles: RoleName[] }[] = [
  { id: 'dashboard', label: 'Dashboard', roles: ['ADMIN', 'MANAGER', 'DIVISION_LEADER', 'MEMBER'] },
  { id: 'projects', label: 'Project', roles: ['ADMIN', 'MANAGER'] },
  { id: 'tasks', label: 'Daftar Task', roles: ['ADMIN', 'MANAGER', 'DIVISION_LEADER', 'MEMBER'] },
  { id: 'delegation', label: 'Delegasi', roles: ['ADMIN', 'MANAGER', 'DIVISION_LEADER'] },
  { id: 'organization', label: 'Organisasi', roles: ['ADMIN'] },
  { id: 'myTasks', label: 'Task Saya', roles: ['ADMIN', 'MANAGER', 'DIVISION_LEADER', 'MEMBER'] },
];

const PAGE_TITLES: Record<PageId, { title: string; sub: string }> = {
  dashboard: { title: 'Dashboard', sub: 'Ringkasan progres & analitik' },
  projects: { title: 'Project', sub: 'Kelola project dan progresnya' },
  tasks: { title: 'Daftar Task', sub: 'Cari, filter, dan kelola task' },
  taskDetail: { title: 'Detail Task', sub: 'Status, subtask, lampiran, riwayat' },
  delegation: { title: 'Delegasi Task', sub: 'Delegasi berjenjang ke divisi & anggota' },
  organization: { title: 'Organisasi', sub: 'Divisi, anggota, dan role (RBAC)' },
  myTasks: { title: 'Task Saya', sub: 'Task yang ditugaskan ke kamu' },
};

function MockupApp() {
  const [page, setPage] = useState<PageId>('dashboard');
  const [role, setRole] = useState<RoleName>('MANAGER');
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
    <div className="min-h-screen bg-mk-bg text-black text-sm">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-65 shrink-0 flex-col gap-5 bg-white border-r-[3px] border-black p-5 sticky top-0 h-screen">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 bg-mk-yellow border-[3px] border-black rounded-full flex items-center justify-center font-black text-xl shadow-brutal-sm">
              A
            </div>
            <div>
              <div className="font-black text-[22px] uppercase">Ambado</div>
              <div className="font-mk-mono text-[10px] tracking-[0.18em] text-mk-muted uppercase">Task Management</div>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            <span className="font-mk-mono text-[10px] tracking-[0.2em] text-mk-muted uppercase">Navigasi</span>
            {NAV.filter((n) => n.roles.includes(role)).map((n) => (
              <button
                key={n.id}
                type="button"
                className={`text-left bg-white border-2 border-black rounded-lg px-3 py-2.5 font-bold shadow-[2px_2px_0_#111] hover:bg-mk-yellow-soft ${page === n.id || (n.id === 'tasks' && page === 'taskDetail') ? 'bg-mk-yellow' : ''}`}
                onClick={() => navigate(n.id)}
              >
                {n.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto border-t-2 border-dashed border-black pt-3">
            <div className="font-extrabold uppercase">{userName(CURRENT_USER_ID)}</div>
            <div className="font-mk-mono text-[11px] text-mk-muted tracking-[0.12em]">{ROLE_LABELS[role]} · MOCKUP</div>
          </div>
        </aside>

        <main className="flex-1 px-6 py-5 pb-10 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-5">
            <div>
              <h1 className="font-black text-[26px] uppercase m-0">{meta.title}</h1>
              <p className="font-mk-mono text-[11px] tracking-[0.14em] text-mk-muted uppercase mt-0.5">{meta.sub}</p>
            </div>
            <div className="flex-1" />
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
          {page === 'tasks' && <TasksPage tasks={taskList} onSelectTask={openTaskDetail} />}
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
