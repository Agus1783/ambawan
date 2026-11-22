// Chip status neo-brutalist (dipakai di tabel task, detail, organisasi).
import type { ReactNode } from 'react';
import type { TaskStatus } from '../../interfaces/types';
import { STATUS_CHIP, STATUS_LABELS } from '../../data/mockData';

export function Chip({ className = '', children }: { className?: string; children: ReactNode }) {
  // Tanpa className (mis. status BACKLOG/CANCELLED yang STATUS_CHIP-nya
  // '') → putih di kedua tema: chip memang pil terang bertuliskan hitam,
  // seperti warna pastel STATUS_CHIP; varian dark menjaga konsistensi
  // dengan pola dark: di halaman yang ditulis ulang.
  const bg = className ? className : 'bg-white dark:bg-[#f2f2ed]';
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
