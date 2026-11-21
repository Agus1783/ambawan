// Halaman Daftar Task (Tahap 2 langkah 4): task dari API + split komponen.
//
// - Daftar task di workspace aktif (GET /tasks?workspace_id=...,
//   limit 100), dipetakan ke tipe Task lokal.
// - Buat task (POST /tasks): setelah 201, daftar dimuat ulang karena
//   respons create hanya membawa field ringkas.
// - Klik baris membuka detail: App mengambil GET /tasks/:id.
// - Dipecah tanpa mengubah perilaku ke: TaskFormModal, TaskFilters,
//   TaskTable, TaskPagination, dan hook useTaskFilter di
//   src/components/tasks/.
//
// Batasan: pilihan divisi + penanggung jawab di form masih mock
// (langkah 6/8); nama project + penanggung jawab di tabel masih dari
// mockData sampai daftar project/anggota dari API dipakai di sini.
import { useEffect, useState } from 'react';
import type { RoleName, Task } from '../interfaces/types';
import api, {
  pesanErrorApi,
  taskFromApiTask,
  type CreateTaskInput,
  type Project,
  type Workspace,
} from '../utils/api';
import { TaskFormModal, type TaskFormValues } from '../components/tasks/TaskFormModal';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { TaskTable } from '../components/tasks/TaskTable';
import { TaskPagination } from '../components/tasks/TaskPagination';
import { useTaskFilter } from '../components/tasks/useTaskFilter';
import {
  btnClass,
  btnYellowClass,
  cardClass,
  mutedClass,
  rowClass,
  stackClass,
} from '../components/ui/UiClasses';

const CAN_CREATE_TASK: RoleName[] = ['ADMIN', 'OWNER', 'MANAGER', 'DIVISION_LEADER'];

export function TasksPage({
  activeWorkspace,
  role,
  onSelectTask,
}: {
  activeWorkspace: Workspace | null;
  role: RoleName;
  onSelectTask: (id: string) => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  // Workspace yang datanya sudah dimuat; loading diturunkan dari sini
  // (pola ProjectsPage) supaya effect tidak memanggil setState sinkron.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const loading = activeWorkspace !== null && loadedFor !== activeWorkspace.id;
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filter = useTaskFilter(tasks);

  const fetchWorkspaceData = (workspaceId: string, isCancelled?: () => boolean) => {
    return Promise.all([
      api.listTasks(workspaceId),
      api.listProjects(workspaceId),
    ])
      .then(([apiTasks, apiProjects]) => {
        if (isCancelled?.()) return;
        setTasks(apiTasks.map(taskFromApiTask));
        setProjects(apiProjects);
        setError(null);
      })
      .catch((err: unknown) => {
        if (isCancelled?.()) return;
        setError(pesanErrorApi(err));
        setTasks([]);
        setProjects([]);
      })
      .finally(() => {
        if (!isCancelled?.()) setLoadedFor(workspaceId);
      });
  };

  useEffect(() => {
    if (!activeWorkspace) {
      return;
    }
    let cancelled = false;
    void fetchWorkspaceData(activeWorkspace.id, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace]);

  const submitTask = async (values: TaskFormValues) => {
    if (!activeWorkspace) return;
    const input: CreateTaskInput = {
      workspace_id: activeWorkspace.id,
      project_id: values.projectId,
      title: values.title,
      description: values.description || undefined,
      priority: values.priority,
      // Form tanggal -> ISO datetime (konvensi yang sama dengan langkah 3).
      deadline: `${values.deadline}T00:00:00.000Z`,
      assignee_id: values.assigneeId || undefined,
      division_id: values.divisionId || undefined,
    };
    setFormSubmitting(true);
    setFormError(null);
    try {
      await api.createTask(input);
      await fetchWorkspaceData(activeWorkspace.id);
      setShowForm(false);
      filter.setPage(1);
      setNotice('Task dibuat.');
    } catch (err) {
      setFormError(pesanErrorApi(err));
    } finally {
      setFormSubmitting(false);
    }
  };

  if (!activeWorkspace) {
    return (
      <div className={stackClass}>
        <div className={cardClass}>
          <p className={mutedClass}>
            Pilih workspace aktif dulu di menu Workspace untuk melihat
            daftar task.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={stackClass}>
      {CAN_CREATE_TASK.includes(role) && (
        <div className={rowClass}>
          <button
            type="button"
            className={btnYellowClass}
            onClick={() => {
              setFormError(null);
              setShowForm(true);
            }}
          >
            + Tambah Tugas
          </button>
        </div>
      )}

      {showForm && (
        <TaskFormModal
          projects={projects}
          initialProjectId={projects[0]?.id ?? ''}
          submitting={formSubmitting}
          error={formError}
          onClose={() => setShowForm(false)}
          onSubmit={submitTask}
        />
      )}

      {notice && (
        <p className={mutedClass} role="status">
          {notice}
        </p>
      )}

      {loading && <p className={mutedClass}>Memuat task...</p>}

      {error && (
        <div className={cardClass}>
          <p role="alert">{error}</p>
          <button
            type="button"
            className={btnClass}
            onClick={() => {
              setLoadedFor(null);
              void fetchWorkspaceData(activeWorkspace.id);
            }}
          >
            Coba lagi
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <TaskFilters
            query={filter.query}
            statusFilter={filter.statusFilter}
            priorityFilter={filter.priorityFilter}
            divisionFilter={filter.divisionFilter}
            onQueryChange={(value) => {
              filter.setQuery(value);
              filter.resetPage();
            }}
            onStatusChange={(value) => {
              filter.setStatusFilter(value);
              filter.resetPage();
            }}
            onPriorityChange={(value) => {
              filter.setPriorityFilter(value);
              filter.resetPage();
            }}
            onDivisionChange={(value) => {
              filter.setDivisionFilter(value);
              filter.resetPage();
            }}
          />

          <TaskTable tasks={filter.pageItems} onSelectTask={onSelectTask} />

          <TaskPagination
            safePage={filter.safePage}
            totalPages={filter.totalPages}
            total={filter.filtered.length}
            onPrev={() => filter.setPage(filter.safePage - 1)}
            onNext={() => filter.setPage(filter.safePage + 1)}
          />
        </>
      )}
    </div>
  );
}
