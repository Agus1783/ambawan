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
import api, { type PublicUser, type Workspace } from "./utils/api";
import {
  labelRoleApi,
  readActiveWorkspaceId,
  resolveActiveWorkspaceId,
  roleNameToGateRole,
  saveActiveWorkspaceId,
} from "./utils/workspace";
import type {
  PageId,
  Project,
  RoleName,
  Task,
  TaskStatus,
} from "./interfaces/types";
import { projects as seedProjects, tasks as seedTasks } from "./data/mockData";

function App() {
  const [page, setPage] = useState<PageId>(() =>
    api.getAccessToken() ? "dashboard" : "login",
  );
  const [role, setRole] = useState<RoleName>("MEMBER");
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
    setRole("MEMBER");
    setPage("login");
  };

  // --- Workspace (Tahap 2 langkah 2): daftar dari API + aktif tersimpan. ---
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    () => readActiveWorkspaceId(),
  );

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) ?? null;

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
        const active = items.find((w) => w.id === resolved) ?? null;
        if (active) {
          setRole(roleNameToGateRole(active.role.name));
        }
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
    const ws = workspaces.find((w) => w.id === id);
    if (ws) {
      setRole(roleNameToGateRole(ws.role.name));
    }
  };

  const handleWorkspaceCreated = (ws: Workspace) => {
    setWorkspaces((prev) => [...prev, ws]);
    handleSelectWorkspace(ws.id);
  };

  const [taskList, setTaskList] = useState<Task[]>(seedTasks);
  const [projectList, setProjectList] = useState<Project[]>(seedProjects);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string[]>>({
    tsk_01: ["Progress sudah 70%, API login hampir selesai."],
  });

  const navigate = (next: PageId) => setPage(next);

  const openTaskDetail = (id: string) => {
    setSelectedTaskId(id);
    setPage("taskDetail");
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTaskList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t)),
    );
  };

  const delegateTask = (taskId: string, assigneeId: string) => {
    setTaskList((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, assigneeId, status: "ASSIGNED" as TaskStatus }
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
          <Sidebar page={page} role={role} onNavigate={navigate} />

          <main className="flex-1 px-6 py-5 pb-10 min-w-0">
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
              user={user}
              onLogout={handleLogout}
            />

            {page === "dashboard" && <DashboardPage tasks={taskList} />}
            {page === "projects" && (
              <ProjectsPage
                projects={projectList}
                tasks={taskList}
                onAddProject={(p) => setProjectList((prev) => [...prev, p])}
                onDeleteProject={(id) =>
                  setProjectList((prev) => prev.filter((p) => p.id !== id))
                }
              />
            )}
            {page === "tasks" && (
              <TasksPage
                tasks={taskList}
                projects={projectList}
                role={role}
                onSelectTask={openTaskDetail}
                onAddTask={(t) => setTaskList((prev) => [t, ...prev])}
              />
            )}

            {page === "taskDetail" && selectedTask && (
              <TaskDetailPage
                task={selectedTask}
                tasks={taskList}
                onBack={() => navigate("tasks")}
                onUpdateStatus={updateTaskStatus}
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
              <DelegationPage tasks={taskList} onDelegate={delegateTask} />
            )}
            {page === "organization" && <OrganizationPage />}
            {page === "myTasks" && (
              <MyTasksPage tasks={taskList} onUpdateStatus={updateTaskStatus} />
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
