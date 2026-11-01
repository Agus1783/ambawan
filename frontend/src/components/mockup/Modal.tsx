// Modal tengah dengan backdrop gelap (form buat project).
import type { ReactNode } from 'react';

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-5" onClick={onClose}>
      <div
        className="bg-white border-[3px] border-black rounded-[10px] shadow-brutal p-4.5 max-w-130 w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-3 items-center flex-wrap justify-between">
          <h3 className="font-black text-base uppercase m-0">{title}</h3>
          <button
            type="button"
            className="border-2 border-black rounded-lg px-4 py-2 font-extrabold bg-white shadow-brutal-sm"
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
