// Halaman Delegasi (Tahap 2 langkah 8): form delegasi + riwayat
// delegasi dari API.
//
// - Pilihan tugas dari daftar task workspace (GET /tasks), pilihan
//   penerima dari anggota workspace (GET /workspaces/:id/members).
// - Delegasi (POST /tasks/:id/delegate) ke satu user; hanya
//   OWNER/MANAGER/DIVISION_LEADER (sesuai seed backend).
// - Riwayat delegasi: riwayat task yang dipilih
//   (GET /tasks/:id/history) yang aksinya DELEGATED. Tidak ada
//   endpoint riwayat delegasi se-workspace, jadi riwayat yang
//   tampil adalah riwayat task yang sedang dipilih.
import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { labelRoleApi } from '../utils/workspace';
import api, {
  pesanErrorApi,
  type ApiTask,
  type ApiTaskHistory,
  type Workspace,
  type WorkspaceMember,
} from '../utils/api';
import {
  btnYellowClass,
  cardClass,
  fieldClass,
  fieldLabelClass,
  inputClass,
  mutedClass,
  rowClass,
  sectionLabelClass,
  sectionTitleClass,
  stackClass,
  timelineDateClass,
  timelineItemClass,
} from '../components/ui/UiClasses';

function formatHistoryDate(iso: string): string {
  return iso.replace('T', ' ').slice(0, 16);
}

export function DelegationPage({
  activeWorkspace,
  canDelegate,
}: {
  activeWorkspace: Workspace | null;
  canDelegate: boolean;
}) {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  // Workspace yang datanya sudah dimuat; loading diturunkan dari sini
  // (pola TasksPage) supaya effect tidak memanggil setState sinkron.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const loading = activeWorkspace !== null && loadedFor !== activeWorkspace.id;
  const [error, setError] = useState<string | null>(null);

  const [taskId, setTaskId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [submitBusy, setSubmitBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Riwayat delegasi task yang sedang dipilih.
  const [delegations, setDelegations] = useState<ApiTaskHistory[]>([]);
  // Task yang riwayatnya sudah dimuat; loading diturunkan dari sini
  // (pola TasksPage) supaya effect tidak memanggil setState sinkron.
  const [historyLoadedFor, setHistoryLoadedFor] = useState<string | null>(
    null,
  );
  const historyLoading = taskId !== '' && historyLoadedFor !== taskId;
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeWorkspace) {
      return;
    }
    const workspaceId = activeWorkspace.id;
    let cancelled = false;
    Promise.all([
      api.listTasks(workspaceId),
      api.listWorkspaceMembers(workspaceId),
    ])
      .then(([apiTasks, apiMembers]) => {
        if (cancelled) return;
        setTasks(apiTasks);
        setMembers(apiMembers);
        setError(null);
        if (apiTasks.length > 0) {
          setTaskId((prev) => prev || apiTasks[0].id);
        }
        if (apiMembers.length > 0) {
          setAssigneeId((prev) => prev || apiMembers[0].id);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(pesanErrorApi(err));
        setTasks([]);
        setMembers([]);
      })
      .finally(() => {
        if (!cancelled) setLoadedFor(workspaceId);
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace]);

  const fetchDelegationHistory = (selectedTaskId: string) => {
    // Tanpa setState sinkron di awal: fungsi ini dipanggil dari
    // effect (ganti task) maupun handler submit; reset error
    // dilakukan di callback .then dan di handler submit.
    api
      .listTaskHistory(selectedTaskId)
      .then((items) => {
        setDelegations(items.filter((h) => h.action === 'DELEGATED'));
        setHistoryError(null);
      })
      .catch((err: unknown) => {
        setHistoryError(pesanErrorApi(err));
        setDelegations([]);
      })
      .finally(() => {
        setHistoryLoadedFor(selectedTaskId);
      });
  };

  useEffect(() => {
    if (!taskId) {
      return;
    }
    fetchDelegationHistory(taskId);
  }, [taskId]);

  // Riwayat hanya ditampilkan bila ada task yang dipilih; tanpa
  // task, daftar lama tidak ikut tampil (tanpa setState di effect).
  const shownDelegations = taskId ? delegations : [];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!taskId || !assigneeId || submitBusy) return;
    setSubmitBusy(true);
    setSubmitError(null);
    try {
      const result = await api.delegateTask(taskId, {
        assignee_id: assigneeId,
      });
      const target = result.assignee?.name ?? 'anggota';
      setNotice(`Tugas didelegasikan ke ${target}.`);
      // Muat ulang riwayat (reset penanda supaya loading tampil).
      setHistoryLoadedFor(null);
      setHistoryError(null);
      fetchDelegationHistory(taskId);
    } catch (err) {
      setSubmitError(pesanErrorApi(err));
    } finally {
      setSubmitBusy(false);
    }
  };

  if (!activeWorkspace) {
    return (
      <div className={stackClass}>
        <div className={cardClass}>
          <p className={mutedClass}>
            Pilih workspace aktif dulu di menu Workspace untuk mendelegasikan
            tugas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={stackClass}>
      {notice && (
        <p className={mutedClass} role="status">
          {notice}
        </p>
      )}

      {loading && <p className={mutedClass}>Memuat data delegasi...</p>}

      {error && (
        <div className={cardClass}>
          <p role="alert">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className={cardClass}>
            <h2 className={sectionTitleClass}>Delegasikan Tugas</h2>
            <p className={sectionLabelClass}>
              Ketua divisi dapat mendelegasikan tugas ke anggota
            </p>
            {!canDelegate && (
              <p className={mutedClass}>
                Role kamu tidak punya izin mendelegasikan tugas (butuh
                OWNER, MANAGER, atau DIVISION_LEADER).
              </p>
            )}
            {canDelegate && tasks.length === 0 && (
              <p className={mutedClass}>Belum ada tugas di workspace ini.</p>
            )}
            {canDelegate && tasks.length > 0 && (
              <form onSubmit={submit} className={rowClass}>
                <label className={fieldClass}>
                  <span className={fieldLabelClass}>Tugas</span>
                  <select
                    className={inputClass}
                    value={taskId}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      setTaskId(e.target.value)
                    }
                  >
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={fieldClass}>
                  <span className={fieldLabelClass}>Delegasikan Ke</span>
                  <select
                    className={inputClass}
                    value={assigneeId}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      setAssigneeId(e.target.value)
                    }
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({labelRoleApi(m.role.name)})
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  className={`${btnYellowClass} self-end`}
                  disabled={submitBusy || !taskId || !assigneeId}
                >
                  {submitBusy ? 'Mendelegasikan...' : 'Delegasikan'}
                </button>
              </form>
            )}
            {submitError && <p role="alert">{submitError}</p>}
          </div>

          <div className={cardClass}>
            <h2 className={sectionTitleClass}>Riwayat Delegasi</h2>
            <p className={sectionLabelClass}>
              Delegasi pada task yang dipilih di atas
            </p>
            {historyLoading && (
              <p className={mutedClass}>Memuat riwayat...</p>
            )}
            {historyError && <p role="alert">{historyError}</p>}
            {!historyLoading && !historyError && (
              <div className="flex flex-col">
                {shownDelegations.map((d) => (
                  <div className={timelineItemClass} key={d.id}>
                    <span className={timelineDateClass}>
                      [{formatHistoryDate(d.createdAt)}]
                    </span>
                    <span>
                      <strong>
                        {tasks.find((t) => t.id === taskId)?.title ?? taskId}
                      </strong>{' '}
                      — {d.description ?? 'Didelegasikan'}
                      {d.user ? ` (oleh ${d.user.name})` : ''}
                    </span>
                  </div>
                ))}
                {shownDelegations.length === 0 && (
                  <p className={mutedClass}>
                    Belum ada delegasi pada task ini.
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
