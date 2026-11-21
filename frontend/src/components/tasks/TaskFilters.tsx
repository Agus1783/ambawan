// Kartu filter daftar task (Tahap 2 langkah 4: pecahan TasksPage).
// Tampilan dan perilaku sama seperti sebelum dipecah.
import type { ChangeEvent } from 'react';
import type { Priority, TaskStatus } from '../../interfaces/types';
import { STATUS_LABELS, divisions } from '../../data/mockData';
import {
  cardClass,
  fieldClass,
  fieldLabelClass,
  inputClass,
  rowClass,
} from '../ui/UiClasses';

export function TaskFilters({
  query,
  statusFilter,
  priorityFilter,
  divisionFilter,
  onQueryChange,
  onStatusChange,
  onPriorityChange,
  onDivisionChange,
}: {
  query: string;
  statusFilter: TaskStatus | 'ALL';
  priorityFilter: Priority | 'ALL';
  divisionFilter: string;
  onQueryChange: (value: string) => void;
  onStatusChange: (value: TaskStatus | 'ALL') => void;
  onPriorityChange: (value: Priority | 'ALL') => void;
  onDivisionChange: (value: string) => void;
}) {
  return (
    <div className={cardClass}>
      <div className={rowClass}>
        <label className={fieldClass}>
          <span className={fieldLabelClass}>Cari Task</span>
          <input
            className={inputClass}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Cari judul task..."
          />
        </label>
        <label className={fieldClass}>
          <span className={fieldLabelClass}>Status</span>
          <select
            className={inputClass}
            value={statusFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              onStatusChange(e.target.value as TaskStatus | 'ALL')
            }
          >
            <option value="ALL">Semua Status</option>
            {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className={fieldClass}>
          <span className={fieldLabelClass}>Prioritas</span>
          <select
            className={inputClass}
            value={priorityFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              onPriorityChange(e.target.value as Priority | 'ALL')
            }
          >
            <option value="ALL">Semua Prioritas</option>
            <option value="P1">P1 - Mendesak</option>
            <option value="P2">P2 - Penting</option>
            <option value="P3">P3 - Normal</option>
          </select>
        </label>
        <label className={fieldClass}>
          <span className={fieldLabelClass}>Divisi</span>
          <select
            className={inputClass}
            value={divisionFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              onDivisionChange(e.target.value)
            }
          >
            <option value="ALL">Semua Divisi</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
