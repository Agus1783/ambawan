import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { Task } from '../src/interfaces/types';
import { useTaskFilter } from '../src/components/tasks/useTaskFilter';

function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    projectId: 'prj_01',
    parentTaskId: null,
    title: 'Task',
    description: '',
    status: 'BACKLOG',
    priority: 'P3',
    deadline: '2026-12-01',
    divisionId: null,
    assigneeId: null,
    ...overrides,
  };
}

describe('useTaskFilter', () => {
  const tasks = [
    makeTask({ id: 't1', title: 'Membuat API Login', status: 'IN_PROGRESS', priority: 'P1', divisionId: 'div_it' }),
    makeTask({ id: 't2', title: 'Desain landing page', status: 'BACKLOG', priority: 'P2', divisionId: 'div_mkt' }),
    makeTask({ id: 't3', title: 'Membuat API Register', status: 'COMPLETED', priority: 'P1', divisionId: 'div_it' }),
  ];

  it('mengembalikan semua task tanpa filter, satu halaman', () => {
    const { result } = renderHook(() => useTaskFilter(tasks));
    expect(result.current.filtered).toHaveLength(3);
    expect(result.current.pageItems).toHaveLength(3);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.safePage).toBe(1);
  });

  it('menyaring berdasarkan judul (case-insensitive)', () => {
    const { result } = renderHook(() => useTaskFilter(tasks));
    act(() => {
      result.current.setQuery('api');
    });
    expect(result.current.filtered.map((t) => t.id)).toEqual(['t1', 't3']);
  });

  it('menyaring berdasarkan status dan prioritas sekaligus', () => {
    const { result } = renderHook(() => useTaskFilter(tasks));
    act(() => {
      result.current.setStatusFilter('COMPLETED');
      result.current.setPriorityFilter('P1');
    });
    expect(result.current.filtered.map((t) => t.id)).toEqual(['t3']);
  });

  it('menyaring berdasarkan divisi', () => {
    const { result } = renderHook(() => useTaskFilter(tasks));
    act(() => {
      result.current.setDivisionFilter('div_mkt');
    });
    expect(result.current.filtered.map((t) => t.id)).toEqual(['t2']);
  });

  it('membagi 6 item per halaman', () => {
    const many = Array.from({ length: 7 }, (_, i) =>
      makeTask({ id: `t${i}`, title: `Task ${i}` }),
    );
    const { result } = renderHook(() => useTaskFilter(many));
    expect(result.current.totalPages).toBe(2);
    expect(result.current.pageItems).toHaveLength(6);
    act(() => {
      result.current.setPage(2);
    });
    expect(result.current.pageItems).toHaveLength(1);
    expect(result.current.pageItems[0]?.id).toBe('t6');
  });

  it('halaman kembali ke 1 saat filter diubah', () => {
    const many = Array.from({ length: 7 }, (_, i) =>
      makeTask({ id: `t${i}`, title: `Task ${i}` }),
    );
    const { result } = renderHook(() => useTaskFilter(many));
    act(() => {
      result.current.setPage(2);
    });
    expect(result.current.safePage).toBe(2);
    act(() => {
      result.current.setQuery('Task 1');
      result.current.resetPage();
    });
    expect(result.current.safePage).toBe(1);
    expect(result.current.filtered.map((t) => t.id)).toEqual(['t1']);
  });
});
