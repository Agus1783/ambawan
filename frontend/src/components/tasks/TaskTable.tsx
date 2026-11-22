// Tabel daftar task (Tahap 2 langkah 4: pecahan TasksPage; langkah 5:
// perbaiki bug dark-mode — kartu kini memakai dark:bg + dark:shadow
// seperti cardClass, bukan lagi bg-white polos).
// Tampilan dan perilaku sama seperti sebelum dipecah, kecuali task
// tanpa deadline menampilkan '—' (daftar API boleh membawa null).
import type { Task } from '../../interfaces/types';
import { isOverdue, projectName, userName } from '../../utils/helpers';
import { Chip, StatusChip } from '../ui/Chip';
import {
  cardBaseClass,
  mutedClass,
  tableTdClass,
  tableThClass,
} from '../ui/UiClasses';

export function TaskTable({
  tasks,
  onSelectTask,
}: {
  tasks: Task[];
  onSelectTask: (id: string) => void;
}) {
  return (
    <div className={`${cardBaseClass} bg-white dark:bg-[#262626] shadow-brutal dark:shadow-brutal-light p-0 overflow-hidden`}>
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
          {tasks.map((t) => (
            <tr
              key={t.id}
              onClick={() => onSelectTask(t.id)}
              className="cursor-pointer"
            >
              <td className={tableTdClass}>
                <strong>{t.title}</strong>
              </td>
              <td className={tableTdClass}>{projectName(t.projectId)}</td>
              <td className={tableTdClass}>
                <StatusChip status={t.status} />
              </td>
              <td className={tableTdClass}>
                <Chip
                  className={
                    t.priority === 'P1'
                      ? 'bg-mk-red-soft'
                      : t.priority === 'P2'
                        ? 'bg-mk-yellow-soft'
                        : ''
                  }
                >
                  {t.priority}
                </Chip>
              </td>
              <td className={tableTdClass}>
                {t.deadline || '—'}
                {t.deadline && isOverdue(t) ? ' ⚠' : ''}
              </td>
              <td className={tableTdClass}>{userName(t.assigneeId)}</td>
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={6} className={`${tableTdClass} ${mutedClass}`}>
                Tidak ada task yang cocok dengan filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
