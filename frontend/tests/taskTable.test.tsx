import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { Task } from '../src/interfaces/types';
import { TaskTable } from '../src/components/tasks/TaskTable';

function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    projectId: 'prj_01',
    parentTaskId: null,
    title: 'Membuat API Login',
    description: '',
    status: 'IN_PROGRESS',
    priority: 'P1',
    deadline: '2026-12-01',
    divisionId: null,
    assigneeId: 'usr_02',
    ...overrides,
  };
}

describe('TaskTable (langkah 5: perbaikan dark-mode)', () => {
  it('kartu tabel memakai varian dark (dark:bg + dark:shadow) seperti cardClass', () => {
    const { container } = render(
      <TaskTable tasks={[makeTask({ id: 't1' })]} onSelectTask={vi.fn()} />,
    );

    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveClass('bg-white');
    expect(wrapper).toHaveClass('dark:bg-[#262626]');
    expect(wrapper).toHaveClass('shadow-brutal');
    expect(wrapper).toHaveClass('dark:shadow-brutal-light');
  });

  it('memanggil onSelectTask saat baris diklik', () => {
    const onSelectTask = vi.fn();
    render(
      <TaskTable tasks={[makeTask({ id: 't1' })]} onSelectTask={onSelectTask} />,
    );

    screen.getByText('Membuat API Login').click();
    expect(onSelectTask).toHaveBeenCalledWith('t1');
  });
});
