// Halaman Task Saya (Tahap 2 langkah 8): task yang ditugaskan
// ke pengguna saat ini, dari API.
//
// - Daftar (GET /tasks?workspace_id=...&assignee_id=<user.id>):
//   server sudah memfilter ke task milik user ini; nama project
//   dibawa item daftar, jadi tidak lagi dari mockData.
// - Tombol aksi status memanggil PUT /tasks/:id/status langsung
//   (semua role boleh mengubah status, sesuai seed backend).
import { useEffect, useState } from 'react';
import type { TaskStatus } from '../interfaces/types';
import api, {
  pesanErrorApi,
  type ApiTask,
  type Workspace,
} from '../utils/api';
import { StatusChip } from '../components/ui/Chip';
import {
  btnClass,
  btnYellowClass,
  cardClass,
  grid2Class,
  mutedClass,
  rowClass,
  stackClass,
} from '../components/ui/UiClasses';

export function MyTasksPage({
  activeWorkspace,
  currentUserId,
}: {
  activeWorkspace: Workspace | null;
  currentUserId: string;
}) {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  // Workspace yang datanya sudah dimuat; loading diturunkan dari sini
  // (pola TasksPage) supaya effect tidak memanggil setState sinkron.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const loading = activeWorkspace !== null && loadedFor !== activeWorkspace.id;
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchMyTasks = (
    workspaceId: string,
    isCancelled?: () => boolean,
  ) => {
    return api
      .listTasks(workspaceId, { assigneeId: currentUserId })
      .then((items) => {
        if (isCancelled?.()) return;
        setTasks(items);
        setError(null);
      })
      .catch((err: unknown) => {
        if (isCancelled?.()) return;
        setError(pesanErrorApi(err));
        setTasks([]);
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
    void fetchMyTasks(activeWorkspace.id, () => cancelled);
    return () => {
      cancelled = true;
    };
    // fetchMyTasks sengaja tidak di dependensi: identitas fungsinya
    // berubah tiap render. currentUserId sudah ada di dependensi,
    // jadi ganti user tetap memuat ulang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspace, currentUserId]);

  const reload = () => {
    if (!activeWorkspace) return;
    setLoadedFor(null);
    void fetchMyTasks(activeWorkspace.id);
  };

  const updateStatus = async (id: string, status: TaskStatus) => {
    if (busyId) return;
    setBusyId(id);
    setActionError(null);
    try {
      await api.updateTaskStatus(id, status);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t)),
      );
    } catch (err) {
      setActionError(pesanErrorApi(err));
    } finally {
      setBusyId(null);
    }
  };

  if (!activeWorkspace) {
    return (
      <div className={stackClass}>
        <div className={cardClass}>
          <p className={mutedClass}>
            Pilih workspace aktif dulu di menu Workspace untuk melihat
            tugasmu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={stackClass}>
      {loading && <p className={mutedClass}>Memuat tugasmu...</p>}

      {error && (
        <div className={cardClass}>
          <p role="alert">{error}</p>
          <button
            type="button"
            className={`${btnClass} mt-3`}
            onClick={reload}
          >
            Coba lagi
          </button>
        </div>
      )}

      {actionError && <p role="alert">{actionError}</p>}

      {!loading && !error && (
        <div className={grid2Class}>
          {tasks.map((t) => (
            <div className={cardClass} key={t.id}>
              <div className={`${rowClass} justify-between`}>
                <strong>{t.title}</strong>
                <StatusChip status={t.status} />
              </div>
              <p className={mutedClass}>
                {t.project?.name ?? 'Tanpa project'} · Deadline:{' '}
                {t.deadline ? t.deadline.slice(0, 10) : '—'}
              </p>
              <div className={rowClass}>
                <button
                  type="button"
                  className={btnClass}
                  disabled={busyId === t.id}
                  onClick={() => void updateStatus(t.id, 'IN_PROGRESS')}
                >
                  Mulai
                </button>
                <button
                  type="button"
                  className={btnYellowClass}
                  disabled={busyId === t.id}
                  onClick={() => void updateStatus(t.id, 'REVIEW')}
                >
                  Ajukan Review
                </button>
                <button
                  type="button"
                  className={btnClass}
                  disabled={busyId === t.id}
                  onClick={() => void updateStatus(t.id, 'COMPLETED')}
                >
                  Selesai
                </button>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className={mutedClass}>
              Tidak ada tugas yang ditugaskan ke kamu.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
