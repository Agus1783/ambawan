// Halaman Daftar Task mockup: cari + filter status/prioritas/divisi + pagination.
import { useState } from 'react';
import type { ChangeEvent } from 'react';
import type { Priority, Task, TaskStatus } from '../data/mockData';
import { STATUS_LABELS, divisions, isOverdue, projectName, userName } from '../data/mockData';
import { Chip, StatusChip } from '../components/mockup/Chip';
import {
  btnClass,
  cardClass,
  fieldClass,
  fieldLabelClass,
  inputClass,
  mutedClass,
  rowClass,
  stackClass,
  tableTdClass,
  tableThClass,
} from '../components/mockup/UiClasses';

const PAGE_SIZE = 6;

export function TasksPage({ tasks, onSelectTask }: { tasks: Task[]; onSelectTask: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');
  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const filtered = tasks.filter((t) => {
    const matchQuery = t.title.toLowerCase().includes(query.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const matchDivision = divisionFilter === 'ALL' || t.divisionId === divisionFilter;
    return matchQuery && matchStatus && matchPriority && matchDivision;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const resetPage = () => setPage(1);

  return (
    <div className={stackClass}>
      <div className={cardClass}>
        <div className={rowClass}>
          <label className={fieldClass}>
            <span className={fieldLabelClass}>Cari Task</span>
            <input className={inputClass} value={query} onChange={(e) => { setQuery(e.target.value); resetPage(); }} placeholder="Cari judul task..." />
          </label>
          <label className={fieldClass}>
            <span className={fieldLabelClass}>Status</span>
            <select className={inputClass} value={statusFilter} onChange={(e: ChangeEvent<HTMLSelectElement>) => { setStatusFilter(e.target.value as TaskStatus | 'ALL'); resetPage(); }}>
              <option value="ALL">Semua Status</option>
              {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </label>
          <label className={fieldClass}>
            <span className={fieldLabelClass}>Prioritas</span>
            <select className={inputClass} value={priorityFilter} onChange={(e: ChangeEvent<HTMLSelectElement>) => { setPriorityFilter(e.target.value as Priority | 'ALL'); resetPage(); }}>
              <option value="ALL">Semua Prioritas</option>
              <option value="P1">P1 - Mendesak</option>
              <option value="P2">P2 - Penting</option>
              <option value="P3">P3 - Normal</option>
            </select>
          </label>
          <label className={fieldClass}>
            <span className={fieldLabelClass}>Divisi</span>
            <select className={inputClass} value={divisionFilter} onChange={(e: ChangeEvent<HTMLSelectElement>) => { setDivisionFilter(e.target.value); resetPage(); }}>
              <option value="ALL">Semua Divisi</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className={`${cardClass} p-0 overflow-hidden`}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={tableThClass}>Judul</th>
              <th className={tableThClass}>Project</th>
              <th className={tableThClass}>Status</th>
              <th className={tableThClass}>Prioritas</th>
              <th className={tableThClass}>Deadline</th>
              <th className={tableThClass}>Penanggung Jawab</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((t) => (
              <tr key={t.id} onClick={() => onSelectTask(t.id)} className="cursor-pointer">
                <td className={tableTdClass}><strong>{t.title}</strong></td>
                <td className={tableTdClass}>{projectName(t.projectId)}</td>
                <td className={tableTdClass}><StatusChip status={t.status} /></td>
                <td className={tableTdClass}>
                  <Chip className={t.priority === 'P1' ? 'bg-mk-red-soft' : t.priority === 'P2' ? 'bg-mk-yellow-soft' : ''}>{t.priority}</Chip>
                </td>
                <td className={tableTdClass}>{t.deadline}{isOverdue(t) ? ' ⚠' : ''}</td>
                <td className={tableTdClass}>{userName(t.assigneeId)}</td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr><td colSpan={6} className={`${tableTdClass} ${mutedClass}`}>Tidak ada task yang cocok dengan filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={`${rowClass} justify-between`}>
        <span className={mutedClass}>Halaman {safePage} dari {totalPages} · {filtered.length} task</span>
        <span className={rowClass}>
          <button type="button" className={btnClass} disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>PREV</button>
          <button type="button" className={btnClass} disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>NEXT</button>
        </span>
      </div>
    </div>
  );
}
