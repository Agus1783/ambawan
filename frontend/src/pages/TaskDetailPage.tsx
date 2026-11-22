// Halaman Detail Task (Tahap 2 langkah 5): status, subtask, delegasi,
// dan hapus dari API untuk task yang berasal dari API.
//
// - Ubah status (PUT /tasks/:id/status): semua role boleh; gagal dari
//   server ditampilkan, bukan diubah diam-diam.
// - Subtask dari API (GET /tasks/:id/subtasks) + buat subtask
//   (POST /tasks dengan parent_task_id, project_id induk, dan
//   workspace aktif). Deadline subtask opsional.
// - Delegasi (POST /tasks/:id/delegate) ke satu user ATAU satu divisi;
//   hanya OWNER/MANAGER/DIVISION_LEADER (sesuai seed backend).
// - Hapus task (DELETE /tasks/:id, 204) dengan modal konfirmasi;
//   subtask ikut terhapus di server (FK cascade).
// - Task mock (dari Dashboard/MyTasks/Delegation, belum ada di
//   backend) tetap memakai perilaku lokal lama: status diubah lokal,
//   subtask dari taskList, tanpa tombol delegasi/hapus API.
//
// Batasan: pilihan user/divisi di form delegasi dari API
// (Tahap 2 langkah 6) — dimuat untuk workspace aktif saat halaman
// dibuka, jadi id yang dipilih selalu anggota workspace.
import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { RoleName, Task, TaskStatus } from '../interfaces/types';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  CURRENT_USER_ID,
  attachments,
  history,
} from '../data/mockData';
import { divisionName, formatFileSize, projectName, userName } from '../utils/helpers';
import api, {
  pesanErrorApi,
  type ApiSubtask,
  type DelegateTaskInput,
  type Division,
  type WorkspaceMember,
} from '../utils/api';
import { Chip, StatusChip } from '../components/ui/Chip';
import { Modal } from '../components/ui/Modal';
import {
  btnBlueClass,
  btnClass,
  btnYellowClass,
  cardClass,
  fieldClass,
  fieldLabelClass,
  grid2Class,
  inputClass,
  mutedClass,
  rowClass,
  sectionLabelClass,
  sectionTitleClass,
  stackClass,
  timelineDateClass,
  timelineItemClass,
} from '../components/ui/UiClasses';

const CAN_DELETE_TASK: RoleName[] = [
  'ADMIN',
  'OWNER',
  'MANAGER',
  'DIVISION_LEADER',
];
const CAN_DELEGATE_TASK: RoleName[] = [
  'ADMIN',
  'OWNER',
  'MANAGER',
  'DIVISION_LEADER',
];

export function TaskDetailPage({
  task,
  tasks,
  workspaceId,
  role,
  isApiTask,
  onBack,
  onUpdateStatus,
  onDeleteTask,
  onDelegateTask,
  comments,
  onAddComment,
}: {
  task: Task;
  tasks: Task[];
  workspaceId: string | null;
  role: RoleName;
  isApiTask: boolean;
  onBack: () => void;
  onUpdateStatus: (id: string, status: TaskStatus) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onDelegateTask: (id: string, input: DelegateTaskInput) => Promise<void>;
  comments: string[];
  onAddComment: (text: string) => void;
}) {
  const [comment, setComment] = useState('');
  const [attachmentList, setAttachmentList] = useState(attachments);
  const [notice, setNotice] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Subtask dari API (task API) atau dari taskList (task mock).
  const mockSubtasks = tasks.filter((t) => t.parentTaskId === task.id);
  const [subtasks, setSubtasks] = useState<ApiSubtask[]>([]);
  // Task yang subtask-nya sudah dimuat; loading diturunkan dari sini
  // (pola TasksPage) supaya effect tidak memanggil setState sinkron.
  const [subtasksLoadedFor, setSubtasksLoadedFor] = useState<string | null>(
    null,
  );
  const subtasksLoading = isApiTask && subtasksLoadedFor !== task.id;
  const [subtasksError, setSubtasksError] = useState<string | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskPriority, setSubtaskPriority] = useState<Task['priority']>('P3');
  const [subtaskDeadline, setSubtaskDeadline] = useState('');
  const [subtaskBusy, setSubtaskBusy] = useState(false);
  const [subtaskError, setSubtaskError] = useState<string | null>(null);

  // Delegasi (task API saja): pilihan user/divisi dari API.
  const [delegateKind, setDelegateKind] = useState<'user' | 'division'>(
    'user',
  );
  const [delegateUserId, setDelegateUserId] = useState('');
  const [delegateDivisionId, setDelegateDivisionId] = useState('');
  const [delegateDivisions, setDelegateDivisions] = useState<Division[]>([]);
  const [delegateMembers, setDelegateMembers] = useState<WorkspaceMember[]>(
    [],
  );
  // Task yang pilihan delegasinya sudah dimuat; loading diturunkan
  // dari sini (pola subtask di atas) supaya effect tidak memanggil
  // setState sinkron.
  const [delegateLoadedFor, setDelegateLoadedFor] = useState<string | null>(
    null,
  );
  const delegateOptionsLoading =
    isApiTask && delegateLoadedFor !== task.id;
  const [delegateOptionsError, setDelegateOptionsError] = useState<
    string | null
  >(null);
  const [delegateBusy, setDelegateBusy] = useState(false);
  const [delegateError, setDelegateError] = useState<string | null>(null);

  // Hapus task (task API saja).
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchSubtasks = (taskId: string, isCancelled?: () => boolean) => {
    return api
      .listSubtasks(taskId)
      .then((items) => {
        if (isCancelled?.()) return;
        setSubtasks(items);
        setSubtasksError(null);
      })
      .catch((err: unknown) => {
        if (isCancelled?.()) return;
        setSubtasksError(pesanErrorApi(err));
        setSubtasks([]);
      })
      .finally(() => {
        if (!isCancelled?.()) setSubtasksLoadedFor(taskId);
      });
  };

  useEffect(() => {
    if (!isApiTask) {
      return;
    }
    let cancelled = false;
    void fetchSubtasks(task.id, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [task.id, isApiTask]);

  const fetchDelegateOptions = (
    taskId: string,
    wsId: string,
    isCancelled?: () => boolean,
  ) => {
    return Promise.all([
      api.listDivisions(wsId),
      api.listWorkspaceMembers(wsId),
    ])
      .then(([apiDivisions, apiMembers]) => {
        if (isCancelled?.()) return;
        setDelegateDivisions(apiDivisions);
        setDelegateMembers(apiMembers);
        setDelegateOptionsError(null);
        // Pilihan awal: anggota/divisi pertama dari API.
        setDelegateUserId((prev) => prev || apiMembers[0]?.id || '');
        setDelegateDivisionId(
          (prev) => prev || apiDivisions[0]?.id || '',
        );
      })
      .catch((err: unknown) => {
        if (isCancelled?.()) return;
        setDelegateOptionsError(pesanErrorApi(err));
        setDelegateDivisions([]);
        setDelegateMembers([]);
      })
      .finally(() => {
        if (!isCancelled?.()) setDelegateLoadedFor(taskId);
      });
  };

  useEffect(() => {
    if (!isApiTask || !workspaceId) {
      return;
    }
    let cancelled = false;
    void fetchDelegateOptions(task.id, workspaceId, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [task.id, isApiTask, workspaceId]);

  // Nama divisi/penanggung jawab: task API memakai daftar dari API
  // (id mock tidak cocok); task mock tetap memakai helper mock.
  const shownDivisionName = isApiTask
    ? task.divisionId
      ? (delegateDivisions.find((d) => d.id === task.divisionId)?.name ??
        (delegateOptionsLoading ? 'Memuat...' : task.divisionId))
      : '—'
    : divisionName(task.divisionId);
  const shownAssigneeName = isApiTask
    ? task.assigneeId
      ? (delegateMembers.find((m) => m.id === task.assigneeId)?.name ??
        (delegateOptionsLoading ? 'Memuat...' : task.assigneeId))
      : 'Belum ditentukan'
    : userName(task.assigneeId);

  const subtasksToShow: { id: string; title: string; status: TaskStatus; assigneeName: string }[] =
    isApiTask
      ? subtasks.map((s) => ({
          id: s.id,
          title: s.title,
          status: s.status,
          assigneeName: s.assignee?.name ?? 'Belum ditentukan',
        }))
      : mockSubtasks.map((s) => ({
          id: s.id,
          title: s.title,
          status: s.status,
          assigneeName: userName(s.assigneeId),
        }));

  const taskHistory = history.filter((h) => h.taskId === task.id);
  const taskAttachments = attachmentList.filter((a) => a.taskId === task.id);

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setAttachmentList((prev) => [
      ...prev,
      ...files.map((f, i) => ({
        id: `att_${Date.now()}_${i}`,
        taskId: task.id,
        fileName: f.name,
        fileType: f.type || 'unknown',
        fileSize: f.size,
        uploadedBy: CURRENT_USER_ID,
      })),
    ]);
    e.target.value = '';
  };

  const submitComment = (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    onAddComment(comment.trim());
    setComment('');
  };

  const changeStatus = async (status: TaskStatus) => {
    if (statusBusy || status === task.status) return;
    setStatusBusy(true);
    setStatusError(null);
    try {
      await onUpdateStatus(task.id, status);
      setNotice(`Status diubah ke ${STATUS_LABELS[status]}.`);
    } catch (err) {
      setStatusError(pesanErrorApi(err));
    } finally {
      setStatusBusy(false);
    }
  };

  const submitSubtask = async (e: FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle.trim() || !workspaceId || subtaskBusy) return;
    setSubtaskBusy(true);
    setSubtaskError(null);
    try {
      await api.createTask({
        workspace_id: workspaceId,
        project_id: task.projectId,
        parent_task_id: task.id,
        title: subtaskTitle.trim(),
        priority: subtaskPriority,
        deadline: subtaskDeadline
          ? `${subtaskDeadline}T00:00:00.000Z`
          : undefined,
      });
      setSubtaskTitle('');
      setSubtaskDeadline('');
      setSubtaskPriority('P3');
      setNotice('Subtask dibuat.');
      // Muat ulang daftar subtask dari API.
      setSubtasksLoadedFor(null);
      void fetchSubtasks(task.id);
    } catch (err) {
      setSubtaskError(pesanErrorApi(err));
    } finally {
      setSubtaskBusy(false);
    }
  };

  const submitDelegate = async (e: FormEvent) => {
    e.preventDefault();
    if (delegateBusy) return;
    const input: DelegateTaskInput =
      delegateKind === 'user'
        ? { assignee_id: delegateUserId }
        : { division_id: delegateDivisionId };
    if (!input.assignee_id && !input.division_id) return;
    setDelegateBusy(true);
    setDelegateError(null);
    try {
      await onDelegateTask(task.id, input);
      setNotice('Task didelegasikan.');
    } catch (err) {
      setDelegateError(pesanErrorApi(err));
    } finally {
      setDelegateBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await onDeleteTask(task.id);
      setConfirmingDelete(false);
    } catch (err) {
      setDeleteError(pesanErrorApi(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className={stackClass}>
      <div className={rowClass}>
        <button type="button" className={btnClass} onClick={onBack}>← Kembali ke Daftar</button>
        {isApiTask && CAN_DELETE_TASK.includes(role) && (
          <button
            type="button"
            className={btnClass}
            onClick={() => {
              setDeleteError(null);
              setConfirmingDelete(true);
            }}
          >
            Hapus Task
          </button>
        )}
      </div>

      {notice && (
        <p className={mutedClass} role="status">
          {notice}
        </p>
      )}

      <div className={cardClass}>
        <div className={`${rowClass} justify-between`}>
          <h2 className={`${sectionTitleClass} m-0`}>{task.title}</h2>
          <span className={rowClass}>
            <StatusChip status={task.status} />
            <Chip className={task.priority === 'P1' ? 'bg-mk-red-soft' : task.priority === 'P2' ? 'bg-mk-yellow-soft' : ''}>
              {PRIORITY_LABELS[task.priority]}
            </Chip>
          </span>
        </div>
        <p>{task.description}</p>
        <p className={mutedClass}>
          Project: {projectName(task.projectId)} · Divisi: {shownDivisionName} ·
          Penanggung jawab: {shownAssigneeName} · Deadline: {task.deadline || '—'}
        </p>
        <div className={rowClass}>
          <span className={fieldLabelClass}>Ubah Status:</span>
          {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              className={task.status === s ? btnYellowClass : btnClass}
              disabled={statusBusy}
              onClick={() => void changeStatus(s)}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        {statusError && <p role="alert">{statusError}</p>}
      </div>

      <div className={grid2Class}>
        <div className={cardClass}>
          <h3 className={sectionTitleClass}>Subtugas</h3>
          <p className={sectionLabelClass}>{subtasksToShow.length} subtugas</p>
          {subtasksLoading && <p className={mutedClass}>Memuat subtugas...</p>}
          {subtasksError && <p role="alert">{subtasksError}</p>}
          {!subtasksLoading && subtasksToShow.length === 0 && (
            <p className={mutedClass}>Tidak ada subtugas.</p>
          )}
          {subtasksToShow.map((s) => (
            <div key={s.id} className={`${rowClass} justify-between mb-2`}>
              <span>{s.title}</span>
              <span className={rowClass}>
                <span className={mutedClass}>{s.assigneeName}</span>
                <StatusChip status={s.status} />
              </span>
            </div>
          ))}
          {isApiTask && workspaceId && (
            <form onSubmit={submitSubtask} className="flex flex-col gap-2 mt-3">
              <label className={fieldClass}>
                <span className={fieldLabelClass}>Judul Subtugas</span>
                <input
                  className={inputClass}
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  placeholder="Contoh: Membuat skema tabel user"
                />
              </label>
              <span className={rowClass}>
                <label className={fieldClass}>
                  <span className={fieldLabelClass}>Prioritas</span>
                  <select
                    className={inputClass}
                    value={subtaskPriority}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      setSubtaskPriority(e.target.value as Task['priority'])
                    }
                  >
                    <option value="P1">P1 - Mendesak</option>
                    <option value="P2">P2 - Penting</option>
                    <option value="P3">P3 - Normal</option>
                  </select>
                </label>
                <label className={fieldClass}>
                  <span className={fieldLabelClass}>Deadline (opsional)</span>
                  <input
                    className={inputClass}
                    type="date"
                    value={subtaskDeadline}
                    onChange={(e) => setSubtaskDeadline(e.target.value)}
                  />
                </label>
              </span>
              {subtaskError && <p role="alert">{subtaskError}</p>}
              <span>
                <button
                  type="submit"
                  className={btnYellowClass}
                  disabled={subtaskBusy || !subtaskTitle.trim()}
                >
                  {subtaskBusy ? 'Menyimpan...' : '+ Tambah Subtugas'}
                </button>
              </span>
            </form>
          )}
        </div>

        <div className={cardClass}>
          <h3 className={sectionTitleClass}>Lampiran</h3>
          <p className={sectionLabelClass}>Disimpan di Supabase Storage (mock)</p>
          {taskAttachments.length === 0 && <p className={mutedClass}>Belum ada lampiran.</p>}
          {taskAttachments.map((a) => (
            <div key={a.id} className={`${rowClass} justify-between mb-2`}>
              <span>{a.fileName}</span>
              <span className={mutedClass}>{formatFileSize(a.fileSize)}</span>
            </div>
          ))}
          <label className={`${btnBlueClass} mt-2 cursor-pointer`}>
            + Upload File
            <input type="file" multiple hidden onChange={handleUpload} />
          </label>

        </div>
      </div>

      {isApiTask && CAN_DELEGATE_TASK.includes(role) && (
        <div className={cardClass}>
          <h3 className={sectionTitleClass}>Delegasikan Tugas</h3>
          <p className={sectionLabelClass}>
            Delegasi ke satu user atau satu divisi dari workspace aktif.
          </p>
          {delegateOptionsLoading && (
            <p className={mutedClass}>Memuat pilihan delegasi...</p>
          )}
          {delegateOptionsError && <p role="alert">{delegateOptionsError}</p>}
          <form onSubmit={submitDelegate} className={rowClass}>
            <label className={fieldClass}>
              <span className={fieldLabelClass}>Delegasikan Ke</span>
              <select
                className={inputClass}
                value={delegateKind}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setDelegateKind(e.target.value as 'user' | 'division')
                }
              >
                <option value="user">Pengguna</option>
                <option value="division">Divisi</option>
              </select>
            </label>
            {delegateKind === 'user' ? (
              <label className={fieldClass}>
                <span className={fieldLabelClass}>Pengguna</span>
                <select
                  className={inputClass}
                  value={delegateUserId}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setDelegateUserId(e.target.value)
                  }
                >
                  {delegateMembers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className={fieldClass}>
                <span className={fieldLabelClass}>Divisi</span>
                <select
                  className={inputClass}
                  value={delegateDivisionId}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setDelegateDivisionId(e.target.value)
                  }
                >
                  {delegateDivisions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              type="submit"
              className={`${btnYellowClass} self-end`}
              disabled={
                delegateBusy ||
                (delegateKind === 'user' && !delegateUserId) ||
                (delegateKind === 'division' && !delegateDivisionId)
              }
            >
              {delegateBusy ? 'Mendelegasikan...' : 'Delegasikan'}
            </button>
          </form>
          {delegateError && <p role="alert">{delegateError}</p>}
        </div>
      )}

      <div className={grid2Class}>
        <div className={cardClass}>
          <h3 className={sectionTitleClass}>Riwayat Tugas</h3>
          <p className={sectionLabelClass}>Timeline aktivitas</p>
          <div className="flex flex-col">
            {taskHistory.map((h) => (
              <div className={timelineItemClass} key={h.id}>
                <span className={timelineDateClass}>[{h.createdAt}]</span>
                <span>
                  <strong>{userName(h.userId)}</strong> — {h.action}
                  {h.oldStatus && h.newStatus ? ` (${STATUS_LABELS[h.oldStatus as TaskStatus]} → ${STATUS_LABELS[h.newStatus as TaskStatus]})` : ''}
                  {h.description ? ` — ${h.description}` : ''}
                </span>
              </div>
            ))}
            {taskHistory.length === 0 && <p className={mutedClass}>Belum ada riwayat.</p>}
          </div>
        </div>

        <div className={cardClass}>
          <h3 className={sectionTitleClass}>Komentar</h3>
          <p className={sectionLabelClass}>{comments.length} komentar</p>
          {comments.map((c, i) => (
            <p key={i} className="border-b-2 border-dashed border-[#e5e5e0] dark:border-[#404040] pb-2">{c}</p>
          ))}
          <form onSubmit={submitComment} className="flex flex-col gap-2 mt-3">
            <textarea className={inputClass} value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Tulis komentar..." />
            <button type="submit" className={btnYellowClass}>Kirim Komentar</button>
          </form>
        </div>
      </div>

      {confirmingDelete && (
        <Modal title="Hapus Task" onClose={() => setConfirmingDelete(false)}>
          <p>
            Hapus task <strong>{task.title}</strong>? Semua subtask di
            bawahnya ikut terhapus.
          </p>
          {deleteError && <p role="alert">{deleteError}</p>}
          <span className="flex gap-2 flex-wrap">
            <button
              type="button"
              className={btnYellowClass}
              disabled={deleteBusy}
              onClick={() => void confirmDelete()}
            >
              {deleteBusy ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
            <button
              type="button"
              className={btnClass}
              onClick={() => setConfirmingDelete(false)}
            >
              Batal
            </button>
          </span>
        </Modal>
      )}
    </div>
  );
}
