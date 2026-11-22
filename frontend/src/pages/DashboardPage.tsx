// Halaman Dashboard (Tahap 2 langkah 8): ringkasan + statistik
// task dari API untuk workspace aktif.
//
// - Ringkasan (GET /dashboard/summary): total, selesai, dikerjakan,
//   review, terlambat, dan tingkat penyelesaian — dihitung server
//   dari task dalam kewenangan pemanggil (MEMBER hanya statistik
//   task miliknya sendiri).
// - Statistik (GET /dashboard/tasks): jumlah task per status dan
//   per prioritas.
// - Progres per divisi: daftar divisi (GET /divisions) + daftar
//   task workspace (GET /tasks) lalu dihitung di client.
// - Milestone Roadmap + grafik mingguan dari versi mock DIHAPUS:
//   tidak ada endpoint backend untuk keduanya, jadi menampilkan
//   angka tetap dari mock akan menyesatkan.
import { useEffect, useState } from 'react';
import { STATUS_LABELS } from '../data/mockData';
import type { TaskStatus } from '../interfaces/types';
import api, {
  pesanErrorApi,
  taskFromApiTask,
  type ApiTask,
  type DashboardSummary,
  type DashboardTaskStatistics,
  type Division,
  type Workspace,
} from '../utils/api';
import { Donut } from '../components/ui/Donut';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatCard } from '../components/ui/StatCard';
import {
  btnClass,
  cardClass,
  grid2Class,
  grid3Class,
  mutedClass,
  rowClass,
  sectionLabelClass,
  sectionTitleClass,
  stackClass,
} from '../components/ui/UiClasses';

const TASK_STATUSES: TaskStatus[] = [
  'BACKLOG',
  'ASSIGNED',
  'IN_PROGRESS',
  'REVIEW',
  'COMPLETED',
  'BLOCKED',
  'CANCELLED',
];

const TASK_PRIORITIES = ['P1', 'P2', 'P3'] as const;

export function DashboardPage({
  activeWorkspace,
}: {
  activeWorkspace: Workspace | null;
}) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [statistics, setStatistics] =
    useState<DashboardTaskStatistics | null>(null);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  // Workspace yang datanya sudah dimuat; loading diturunkan dari sini
  // (pola TasksPage) supaya effect tidak memanggil setState sinkron.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const loading = activeWorkspace !== null && loadedFor !== activeWorkspace.id;
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = (
    workspaceId: string,
    isCancelled?: () => boolean,
  ) => {
    return Promise.all([
      api.getDashboardSummary(workspaceId),
      api.getDashboardTaskStatistics(workspaceId),
      api.listDivisions(workspaceId),
      api.listTasks(workspaceId),
    ])
      .then(([apiSummary, apiStatistics, apiDivisions, apiTasks]) => {
        if (isCancelled?.()) return;
        setSummary(apiSummary);
        setStatistics(apiStatistics);
        setDivisions(apiDivisions);
        setTasks(apiTasks);
        setError(null);
      })
      .catch((err: unknown) => {
        if (isCancelled?.()) return;
        setError(pesanErrorApi(err));
        setSummary(null);
        setStatistics(null);
        setDivisions([]);
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
    void fetchDashboardData(activeWorkspace.id, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace]);

  const reload = () => {
    if (!activeWorkspace) return;
    setLoadedFor(null);
    void fetchDashboardData(activeWorkspace.id);
  };

  if (!activeWorkspace) {
    return (
      <div className={stackClass}>
        <div className={cardClass}>
          <p className={mutedClass}>
            Pilih workspace aktif dulu di menu Workspace untuk melihat
            dashboard.
          </p>
        </div>
      </div>
    );
  }

  const total = summary?.totalTasks ?? 0;

  return (
    <div className={stackClass}>
      {loading && <p className={mutedClass}>Memuat dashboard...</p>}

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

      {!loading && !error && summary && statistics && (
        <>
          <div className={grid3Class}>
            <StatCard
              label="Total Task"
              value={String(summary.totalTasks)}
              detail={`${summary.completedTasks} selesai · ${summary.inProgressTasks} dikerjakan`}
            />
            <StatCard
              label="Task Terlambat"
              value={String(summary.overdueTasks)}
              detail="Deadline lewat & belum selesai"
            />
            <div className={`${cardClass} text-center`}>
              <p className={sectionLabelClass}>Progres Keseluruhan</p>
              <Donut percent={summary.completionRate} label="Selesai" />
            </div>
          </div>

          <div className={grid2Class}>
            <div className={cardClass}>
              <h2 className={sectionTitleClass}>Task Per Status</h2>
              <p className={sectionLabelClass}>
                {summary.reviewTasks} task sedang direview
              </p>
              <div className="flex flex-col gap-3.5">
                {TASK_STATUSES.map((status) => {
                  const count = statistics.byStatus[status] ?? 0;
                  const p =
                    total === 0 ? 0 : Math.round((count / total) * 100);
                  return (
                    <div key={status}>
                      <div className={`${rowClass} justify-between`}>
                        <strong>{STATUS_LABELS[status]}</strong>
                        <span className={mutedClass}>
                          {count} · {p}%
                        </span>
                      </div>
                      <ProgressBar percent={p} barClass="bg-mk-yellow" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={cardClass}>
              <h2 className={sectionTitleClass}>Task Per Prioritas</h2>
              <p className={sectionLabelClass}>
                P1 mendesak · P2 penting · P3 biasa
              </p>
              <div className="flex flex-col gap-3.5">
                {TASK_PRIORITIES.map((priority) => {
                  const count = statistics.byPriority[priority] ?? 0;
                  const p =
                    total === 0 ? 0 : Math.round((count / total) * 100);
                  return (
                    <div key={priority}>
                      <div className={`${rowClass} justify-between`}>
                        <strong>{priority}</strong>
                        <span className={mutedClass}>
                          {count} · {p}%
                        </span>
                      </div>
                      <ProgressBar percent={p} barClass="bg-mk-blue" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className={sectionTitleClass}>Progres Per Divisi</h2>
            <p className={sectionLabelClass}>Task selesai / total task</p>
            <div className="flex flex-col gap-3.5">
              {divisions.map((d) => {
                const divTasks = tasks.filter(
                  (t) => taskFromApiTask(t).divisionId === d.id,
                );
                const divDone = divTasks.filter(
                  (t) => t.status === 'COMPLETED',
                ).length;
                const p =
                  divTasks.length === 0
                    ? 0
                    : Math.round((divDone / divTasks.length) * 100);
                return (
                  <div key={d.id}>
                    <div className={`${rowClass} justify-between`}>
                      <strong>{d.name}</strong>
                      <span className={mutedClass}>
                        {divDone}/{divTasks.length} · {p}%
                      </span>
                    </div>
                    <ProgressBar percent={p} barClass="bg-mk-blue" />
                  </div>
                );
              })}
              {divisions.length === 0 && (
                <p className={mutedClass}>Belum ada divisi.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
