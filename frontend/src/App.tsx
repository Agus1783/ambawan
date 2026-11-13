import { useEffect, useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { DashboardPage } from "./pages/DashboardPage";
import { DelegationPage } from "./pages/DelegationPage";
import { MyTasksPage } from "./pages/MyTasksPage";
import { OrganizationPage } from "./pages/OrganizationPage";
import { ProjectsPage } from "./pages/ProjectsPage";
// import { RegisterPage } from './pages/RegisterPage';
import { TaskDetailPage } from "./pages/TaskDetailPage";
import { TasksPage } from "./pages/TasksPage";
import type {
  PageId,
  Project,
  RoleName,
  Task,
  TaskStatus,
} from "./interfaces/types";
import { projects as seedProjects, tasks as seedTasks } from "./data/mockData";

function App() {
  const [page, setPage] = useState<PageId>("dashboard");
  const [role, setRole] = useState<RoleName>("MANAGER");
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
      <div className="flex min-h-screen">
        <Sidebar page={page} role={role} onNavigate={navigate} />

        <main className="flex-1 px-6 py-5 pb-10 min-w-0">
          <Topbar
            page={page}
            theme={theme}
            onToggleTheme={() =>
              setTheme((t) => (t === "dark" ? "light" : "dark"))
            }
            role={role}
            onRoleChange={setRole}
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
        </main>
      </div>
    </div>
  );
}

export default App;
