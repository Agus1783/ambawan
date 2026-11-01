// Halaman Task Saya mockup: task yang ditugaskan ke pengguna saat ini,
// dengan tombol aksi status (Mulai / Ajukan Review / Selesai).
import type { Task, TaskStatus } from '../data/mockData';
import { CURRENT_USER_ID, projectName } from '../data/mockData';
import { StatusChip } from '../components/mockup/Chip';
import {
  btnClass,
  btnYellowClass,
  cardClass,
  grid2Class,
  mutedClass,
  rowClass,
  stackClass,
} from '../components/mockup/UiClasses';

export function MyTasksPage({ tasks, onUpdateStatus }: { tasks: Task[]; onUpdateStatus: (id: string, status: TaskStatus) => void }) {
  const mine = tasks.filter((t) => t.assigneeId === CURRENT_USER_ID);
  return (
    <div className={stackClass}>
      <div className={grid2Class}>
        {mine.map((t) => (
          <div className={cardClass} key={t.id}>
            <div className={`${rowClass} justify-between`}>
              <strong>{t.title}</strong>
              <StatusChip status={t.status} />
            </div>
            <p className={mutedClass}>{projectName(t.projectId)} · Deadline: {t.deadline}</p>
            <div className={rowClass}>
              <button type="button" className={btnClass} onClick={() => onUpdateStatus(t.id, 'IN_PROGRESS')}>Mulai</button>
              <button type="button" className={btnYellowClass} onClick={() => onUpdateStatus(t.id, 'REVIEW')}>Ajukan Review</button>
              <button type="button" className={btnClass} onClick={() => onUpdateStatus(t.id, 'COMPLETED')}>Selesai</button>
            </div>
          </div>
        ))}
        {mine.length === 0 && <p className={mutedClass}>Tidak ada task yang ditugaskan ke kamu.</p>}
      </div>
    </div>
  );
}
