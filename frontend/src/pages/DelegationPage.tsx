// Halaman Delegasi mockup: form delegasi + riwayat delegasi.
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { Task } from '../data/mockData';
import { ROLE_LABELS, history, userName, users } from '../data/mockData';
import {
  btnYellowClass,
  cardClass,
  fieldClass,
  fieldLabelClass,
  inputClass,
  rowClass,
  sectionLabelClass,
  sectionTitleClass,
  stackClass,
  timelineDateClass,
  timelineItemClass,
} from '../components/mockup/UiClasses';

export function DelegationPage({ tasks, onDelegate }: { tasks: Task[]; onDelegate: (taskId: string, assigneeId: string) => void }) {
  const [taskId, setTaskId] = useState(tasks[0]?.id ?? '');
  const [assigneeId, setAssigneeId] = useState(users[1]?.id ?? '');
  const [delegations, setDelegations] = useState(
    history.filter((h) => h.action === 'DELEGATED').map((h) => ({ id: h.id, taskId: h.taskId, to: h.description ?? '', at: h.createdAt })),
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!taskId || !assigneeId) return;
    onDelegate(taskId, assigneeId);
    setDelegations((prev) => [
      { id: `dlg_${Date.now()}`, taskId, to: `Didelegasikan ke ${userName(assigneeId)}`, at: '2026-11-02 10:00' },
      ...prev,
    ]);
  };

  return (
    <div className={stackClass}>
      <div className={cardClass}>
        <h2 className={sectionTitleClass}>Delegasikan Tugas</h2>
        <p className={sectionLabelClass}>Ketua divisi dapat mendelegasikan tugas ke anggota</p>
        <form onSubmit={submit} className={rowClass}>
          <label className={fieldClass}>
            <span className={fieldLabelClass}>Tugas</span>
            <select className={inputClass} value={taskId} onChange={(e: ChangeEvent<HTMLSelectElement>) => setTaskId(e.target.value)}>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </label>
          <label className={fieldClass}>
            <span className={fieldLabelClass}>Delegasikan Ke</span>
            <select className={inputClass} value={assigneeId} onChange={(e: ChangeEvent<HTMLSelectElement>) => setAssigneeId(e.target.value)}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({ROLE_LABELS[u.role]})</option>
              ))}
            </select>
          </label>
          <button type="submit" className={`${btnYellowClass} self-end`}>Delegasikan</button>
        </form>
      </div>

      <div className={cardClass}>
        <h2 className={sectionTitleClass}>Riwayat Delegasi</h2>
        <div className="flex flex-col">
          {delegations.map((d) => (
            <div className={timelineItemClass} key={d.id}>
              <span className={timelineDateClass}>[{d.at}]</span>
              <span><strong>{tasks.find((t) => t.id === d.taskId)?.title ?? d.taskId}</strong> — {d.to}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
