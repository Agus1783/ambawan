import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { Task } from '../src/interfaces/types';
import type { Project, WorkspaceMember } from '../src/utils/api';
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

  it('menampilkan nama project + penanggung jawab dari daftar API, bukan id mentah', () => {
    const projects: Project[] = [
      {
        id: '11111111-2222-3333-4444-555555555555',
        workspace_id: 'ws-1',
        name: 'Aplikasi Absensi',
        description: null,
        deadline: null,
        owner_id: 'u-1',
        industry_id: null,
        project_template_id: null,
        taskCount: 1,
        completedTaskCount: 0,
      },
    ];
    const members: WorkspaceMember[] = [
      {
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        name: 'Sinta Dewi',
        email: 'sinta@example.com',
        role: { id: 'role-member', name: 'MEMBER', is_system: true },
      },
    ];
    render(
      <TaskTable
        tasks={[
          makeTask({
            id: 't1',
            projectId: '11111111-2222-3333-4444-555555555555',
            assigneeId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          }),
        ]}
        projects={projects}
        members={members}
        onSelectTask={vi.fn()}
      />,
    );

    expect(screen.getByText('Aplikasi Absensi')).toBeInTheDocument();
    expect(screen.getByText('Sinta Dewi')).toBeInTheDocument();
    expect(
      screen.queryByText('11111111-2222-3333-4444-555555555555'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'),
    ).not.toBeInTheDocument();
  });
});
