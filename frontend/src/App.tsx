import { useEffect, useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { DashboardPage } from "./pages/DashboardPage";
import { DelegationPage } from "./pages/DelegationPage";
import { MyTasksPage } from "./pages/MyTasksPage";
import { OrganizationPage } from "./pages/OrganizationPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { TaskDetailPage } from "./pages/TaskDetailPage";
import { TasksPage } from "./pages/TasksPage";
import { WorkspacePage } from "./pages/WorkspacePage";
import api, {
  taskFromApiTaskDetail,
  type DelegateTaskInput,
  type PublicUser,
  type Workspace,
} from "./utils/api";
import {
  labelRoleApi,
  readActiveWorkspaceId,
  resolveActiveWorkspaceId,
  roleNameToGateRole,
  saveActiveWorkspaceId,
} from "./utils/workspace";
import type {
  PageId,
  RoleName,
  Task,
  TaskStatus,
} from "./interfaces/types";
import { tasks as seedTasks } from "./data/mockData";

function App() {
  const [page, setPage] = useState<PageId>(() =>
    api.getAccessToken() ? "dashboard" : "login",
  );
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      return localStorage.getItem("ambado-theme") === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("ambado-theme", theme);
    } catch {
      //
    }
  }, [theme]);

  // --- Auth (Tahap 2 langkah 1): sesi dari API, bukan mock. ---
  const [user, setUser] = useState<PublicUser | null>(null);
  const [authChecking, setAuthChecking] = useState(
    () => api.getAccessToken() !== null,
  );
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Pulihkan sesi saat mount: token tersimpan -> GET /auth/me.
  // Tanpa token tidak ada yang perlu diverifikasi (page sudah 'login').
  useEffect(() => {
    if (!api.getAccessToken()) {
      return;
    }
    let cancelled = false;
    api
      .me()
      .then((me) => {
        if (!cancelled) {
          setUser(me);
          setPage("dashboard");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPage("login");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAuthChecking(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 401 pada request ber-token (sesi kedaluwarsa) -> kembali ke login.
  useEffect(() => {
    api.onUnauthorized(() => {
      setUser(null);
      setPage("login");
    });
    return () => {
      api.onUnauthorized(null);
    };
  }, []);

  const handleAuthenticated = (authedUser: PublicUser) => {
    setUser(authedUser);
    setAuthNotice(null);
    setPage("dashboard");
  };

  const handleRegistered = () => {
    setAuthNotice("Registrasi berhasil. Silakan login dengan akun barumu.");
    setPage("login");
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setAuthNotice(null);
    setWorkspaces([]);
    setActiveWorkspaceId(null);
    saveActiveWorkspaceId(null);
    setPage("login");
  };

  // --- Workspace (Tahap 2 langkah 2): daftar dari API + aktif tersimpan. ---
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    () => readActiveWorkspaceId(),
  );

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) ?? null;

  // Role gating diturunkan langsung dari workspace aktif, bukan state
  // terpisah: satu sumber dengan label role di Topbar/Sidebar.
  // Sebelumnya `role` disimpan di state dan sempat tertinggal di
  // MEMBER — sidebar menampilkan "Anggota" dan menu Project/Delegasi/
  // Organisasi hilang, padahal role di workspace adalah Owner.
  const role: RoleName = activeWorkspace
    ? roleNameToGateRole(activeWorkspace.role.name)
    : "MEMBER";

  // Muat workspace setelah user terotentikasi (login / pulih sesi).
  useEffect(() => {
    if (!user) {
      return;
    }
    let cancelled = false;
    api
      .listWorkspaces()
      .then((items) => {
        if (cancelled) {
          return;
        }
        setWorkspaces(items);
        const resolved = resolveActiveWorkspaceId(
          items,
          readActiveWorkspaceId(),
        );
        saveActiveWorkspaceId(resolved);
        setActiveWorkspaceId(resolved);
      })
      .catch(() => {
        if (!cancelled) {
          setWorkspaces([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSelectWorkspace = (id: string) => {
    saveActiveWorkspaceId(id);
    setActiveWorkspaceId(id);
  };

  const handleWorkspaceCreated = (ws: Workspace) => {
    setWorkspaces((prev) => [...prev, ws]);
    handleSelectWorkspace(ws.id);
  };

  const [taskList, setTaskList] = useState<Task[]>(seedTasks);
  // Daftar task mock masih dipakai TaskDetailPage sebagai fallback
  // (task yang belum pernah dibuka dari API); TasksPage memuat task
  // sendiri dari API, Dashboard/MyTasks/Delegation juga dari API
  // sejak langkah 8.
  // ID task yang sudah terkonfirmasi ada di backend (detail berhasil
  // diambil dari API): hanya untuk task inilah aksi langkah 5
  // (status/hapus/delegasi) memanggil API; task mock tetap diubah
  // lokal seperti sebelumnya.
  const [apiTaskIds, setApiTaskIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string[]>>({
    tsk_01: ["Progress sudah 70%, API login hampir selesai."],
  });

  const navigate = (next: PageId) => setPage(next);

  // Detail task dari API (Tahap 2 langkah 4): ambil GET /tasks/:id lalu
  // simpan ke taskList supaya TaskDetailPage menampilkan data asli.
  // Bila gagal (mis. task mock dari halaman lain), tetap pakai task
  // mock yang sudah ada di taskList.
  const openTaskDetail = (id: string) => {
    setSelectedTaskId(id);
    setPage("taskDetail");
    api
      .getTask(id)
      .then((detail) => {
        const mapped = taskFromApiTaskDetail(detail);
        setApiTaskIds((prev) => new Set(prev).add(id));
        setTaskList((prev) =>
          prev.some((t) => t.id === id)
            ? prev.map((t) => (t.id === id ? mapped : t))
            : [mapped, ...prev],
        );
      })
      .catch(() => {
        // Tetap di halaman detail dengan task mock bila ada.
      });
  };

  // Ubah status (Tahap 2 langkah 5): task API lewat
  // PUT /tasks/:id/status; task mock diubah lokal seperti sebelumnya.
  // Gagal dari server dilempar supaya halaman detail menampilkannya.
  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    if (apiTaskIds.has(id)) {
      await api.updateTaskStatus(id, status);
    }
    setTaskList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t)),
    );
  };

  // Hapus task API (DELETE /tasks/:id): setelah 204, keluarkan dari
  // daftar lokal dan kembali ke halaman Tasks.
  const deleteTaskApi = async (id: string): Promise<void> => {
    await api.deleteTask(id);
    setTaskList((prev) => prev.filter((t) => t.id !== id));
    setApiTaskIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setSelectedTaskId(null);
    setPage("tasks");
  };

  // Delegasi task API (POST /tasks/:id/delegate): perbarui
  // penanggung jawab/divisi lokal dari respons server.
  const delegateTaskApi = async (
    id: string,
    input: DelegateTaskInput,
  ): Promise<void> => {
    const result = await api.delegateTask(id, input);
    setTaskList((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              assigneeId: result.assignee?.id ?? null,
              divisionId: result.division?.id ?? null,
            }
          : t,
      ),
    );
  };

  const selectedTask = taskList.find((t) => t.id === selectedTaskId) ?? null;

  return (
    <div
      className={`min-h-screen bg-mk-bg text-black text-sm dark:bg-[#171717] dark:text-mk-bg ${theme === "dark" ? "dark" : ""}`}
    >
      {authChecking ? (
        <p className="min-h-screen flex items-center justify-center font-mk-mono text-[11px] tracking-[0.14em] uppercase text-mk-muted dark:text-[#a3a3a3]">
          Memuat sesi...
        </p>
      ) : !user ? (
        page === "register" ? (
          <RegisterPage
            onRegistered={handleRegistered}
            onAuthenticated={handleAuthenticated}
            onGoLogin={() => setPage("login")}
          />
        ) : (
          <LoginPage
            notice={authNotice}
            onAuthenticated={handleAuthenticated}
            onGoRegister={() => setPage("register")}
          />
        )
      ) : (
        <div className="flex min-h-screen">
          <Sidebar
            page={page}
            role={role}
            user={user}
            roleLabel={
              activeWorkspace
                ? labelRoleApi(activeWorkspace.role.name)
                : null
            }
            onNavigate={navigate}
          />

          <main className="flex flex-1 flex-col px-6 py-5 pb-10 min-w-0">
            <Topbar
              page={page}
              theme={theme}
              onToggleTheme={() =>
                setTheme((t) => (t === "dark" ? "light" : "dark"))
              }
              workspaceName={activeWorkspace?.name ?? null}
              roleLabel={
                activeWorkspace
                  ? labelRoleApi(activeWorkspace.role.name)
                  : null
              }
              onLogout={handleLogout}
            />

            {page === "dashboard" && (
              <DashboardPage activeWorkspace={activeWorkspace} />
            )}
            {page === "projects" && (
              <ProjectsPage
                activeWorkspace={activeWorkspace}
                canManageProjects={role === "OWNER" || role === "MANAGER"}
              />
            )}
            {page === "tasks" && (
              <TasksPage
                activeWorkspace={activeWorkspace}
                role={role}
                onSelectTask={openTaskDetail}
              />
            )}

            {page === "taskDetail" && selectedTask && (
              <TaskDetailPage
                task={selectedTask}
                tasks={taskList}
                workspaceId={activeWorkspace?.id ?? null}
                role={role}
                isApiTask={apiTaskIds.has(selectedTask.id)}
                currentUserId={user.id}
                onBack={() => navigate("tasks")}
                onUpdateStatus={updateTaskStatus}
                onDeleteTask={deleteTaskApi}
                onDelegateTask={delegateTaskApi}
                comments={comments[selectedTask.id] ?? []}
                onAddComment={(text) =>
                  setComments((prev) => ({
                    ...prev,
                    [selectedTask.id]: [...(prev[selectedTask.id] ?? []), text],
                  }))
                }
              />
            )}
            {page === "taskDetail" && !selectedTask && (
              <p className="text-mk-muted">Pilih task dulu dari Daftar Task.</p>
            )}
            {page === "delegation" && (
              <DelegationPage
                activeWorkspace={activeWorkspace}
                canDelegate={
                  role === "OWNER" ||
                  role === "MANAGER" ||
                  role === "DIVISION_LEADER"
                }
              />
            )}
            {page === "organization" && (
              <OrganizationPage
                activeWorkspace={activeWorkspace}
                role={role}
                currentUserId={user.id}
              />
            )}
            {page === "myTasks" && (
              <MyTasksPage
                activeWorkspace={activeWorkspace}
                currentUserId={user.id}
              />
            )}
            {page === "workspace" && (
              <WorkspacePage
                workspaces={workspaces}
                activeWorkspace={activeWorkspace}
                onSelectWorkspace={handleSelectWorkspace}
                onWorkspaceCreated={handleWorkspaceCreated}
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
