// Paginasi daftar task (Tahap 2 langkah 4: pecahan TasksPage).
// Tampilan dan perilaku sama seperti sebelum dipecah.
import { btnClass, mutedClass, rowClass } from '../ui/UiClasses';

export function TaskPagination({
  safePage,
  totalPages,
  total,
  onPrev,
  onNext,
}: {
  safePage: number;
  totalPages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className={`${rowClass} justify-between`}>
      <span className={mutedClass}>
        Halaman {safePage} dari {totalPages} · {total} task
      </span>
      <span className={rowClass}>
        <button
          type="button"
          className={btnClass}
          disabled={safePage <= 1}
          onClick={onPrev}
        >
          PREV
        </button>
        <button
          type="button"
          className={btnClass}
          disabled={safePage >= totalPages}
          onClick={onNext}
        >
          NEXT
        </button>
      </span>
    </div>
  );
}
