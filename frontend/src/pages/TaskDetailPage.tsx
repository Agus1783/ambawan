// Halaman Detail Task mockup: ubah status, subtask, lampiran,
// timeline riwayat, dan komentar.
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Task, TaskStatus } from '../data/mockData';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  attachments,
  divisionName,
  formatFileSize,
  history,
  projectName,
  userName,
} from '../data/mockData';
import { Chip, StatusChip } from '../components/mockup/Chip';
import {
  btnBlueClass,
  btnClass,
  btnYellowClass,
  cardClass,
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
} from '../components/mockup/UiClasses';

export function TaskDetailPage({
  task,
  tasks,
  onBack,
  onUpdateStatus,
  comments,
  onAddComment,
}: {
  task: Task;
  tasks: Task[];
  onBack: () => void;
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  comments: string[];
  onAddComment: (text: string) => void;
}) {
  const [comment, setComment] = useState('');
  const subtasks = tasks.filter((t) => t.parentTaskId === task.id);
  const taskHistory = history.filter((h) => h.taskId === task.id);
  const taskAttachments = attachments.filter((a) => a.taskId === task.id);

  const submitComment = (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    onAddComment(comment.trim());
    setComment('');
  };

  return (
    <div className={stackClass}>
      <div className={rowClass}>
        <button type="button" className={btnClass} onClick={onBack}>← Kembali ke Daftar</button>
      </div>

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
          Project: {projectName(task.projectId)} · Divisi: {divisionName(task.divisionId)} ·
          Penanggung jawab: {userName(task.assigneeId)} · Deadline: {task.deadline}
        </p>
        <div className={rowClass}>
          <span className={fieldLabelClass}>Ubah Status:</span>
          {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              className={task.status === s ? btnYellowClass : btnClass}
              onClick={() => onUpdateStatus(task.id, s)}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className={grid2Class}>
        <div className={cardClass}>
          <h3 className={sectionTitleClass}>Subtask</h3>
          <p className={sectionLabelClass}>{subtasks.length} subtask</p>
          {subtasks.length === 0 && <p className={mutedClass}>Tidak ada subtask.</p>}
          {subtasks.map((s) => (
            <div key={s.id} className={`${rowClass} justify-between mb-2`}>
              <span>{s.title}</span>
              <StatusChip status={s.status} />
            </div>
          ))}
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
          <button type="button" className={`${btnBlueClass} mt-2`}>+ Upload File</button>
        </div>
      </div>

      <div className={grid2Class}>
        <div className={cardClass}>
          <h3 className={sectionTitleClass}>Riwayat Task</h3>
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
            <p key={i} className="border-b-2 border-dashed border-[#e5e5e0] pb-2">{c}</p>
          ))}
          <form onSubmit={submitComment} className="flex flex-col gap-2 mt-3">
            <textarea className={inputClass} value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Tulis komentar..." />
            <button type="submit" className={btnYellowClass}>Kirim Komentar</button>
          </form>
        </div>
      </div>
    </div>
  );
}
