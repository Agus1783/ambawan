/**
 * Filter + paginasi daftar task (Tahap 2 langkah 4: pecahan TasksPage).
 *
 * Logika disaring dari TasksPage tanpa mengubah perilaku: cari berdasarkan
 * judul, filter status/prioritas/divisi, dan paginasi 6 item per halaman.
 * Mengubah filter apa pun mengembalikan halaman ke 1.
 */
import { useMemo, useState } from 'react';
import type { Priority, Task, TaskStatus } from '../../interfaces/types';

const PAGE_SIZE = 6;

export function useTaskFilter(tasks: Task[]) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');
  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      tasks.filter((t) => {
        const matchQuery = t.title.toLowerCase().includes(query.toLowerCase());
        const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
        const matchPriority =
          priorityFilter === 'ALL' || t.priority === priorityFilter;
        const matchDivision =
          divisionFilter === 'ALL' || t.divisionId === divisionFilter;
        return matchQuery && matchStatus && matchPriority && matchDivision;
      }),
    [tasks, query, statusFilter, priorityFilter, divisionFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const resetPage = () => setPage(1);

  return {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    divisionFilter,
    setDivisionFilter,
    page,
    setPage,
    resetPage,
    filtered,
    pageItems,
    totalPages,
    safePage,
  };
}
