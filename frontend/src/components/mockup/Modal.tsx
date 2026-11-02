// Modal tengah dengan backdrop gelap (form buat project).
import type { ReactNode } from 'react';
import { btnClass } from './UiClasses';

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-5" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#262626] border-[3px] border-black dark:border-mk-bg rounded-[10px] shadow-brutal dark:shadow-brutal-light p-4.5 max-w-130 w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-3 items-center flex-wrap justify-between">
          <h3 className="font-black text-base uppercase m-0">{title}</h3>
          <button
            type="button"
            className={btnClass}
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
