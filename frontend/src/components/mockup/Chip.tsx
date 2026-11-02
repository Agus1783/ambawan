// Chip status neo-brutalist (dipakai di tabel task, detail, organisasi).
import type { ReactNode } from 'react';
import type { TaskStatus } from '../../data/mockData';
import { STATUS_CHIP, STATUS_LABELS } from '../../data/mockData';

export function Chip({ className = '', children }: { className?: string; children: ReactNode }) {
  const bg = className ? className : 'bg-white';
  return (
    <span
      className={`inline-block border-2 border-black rounded-full px-2.5 py-0.5 font-mk-mono text-[11px] font-bold uppercase tracking-wide text-black ${bg}`.trim()}

    >
      {children}
    </span>
  );
}

export function StatusChip({ status }: { status: TaskStatus }) {
  return <Chip className={STATUS_CHIP[status]}>{STATUS_LABELS[status]}</Chip>;
}
