import { describe, expect, it } from 'vitest';
import type { Task } from '../src/interfaces/types';
import { divisionName, formatFileSize, isOverdue, projectName, userName } from '../src/utils/helpers';

describe('userName', () => {
  it('mengembalikan nama untuk id yang dikenal', () => {
    expect(userName('usr_02')).toBe('Andi Pratama');
  });

  it('mengembalikan "Belum ditentukan" untuk id null', () => {
    expect(userName(null)).toBe('Belum ditentukan');
  });

  it('mengembalikan id apa adanya untuk id yang tidak dikenal', () => {
    expect(userName('usr_99')).toBe('usr_99');
  });
});

describe('divisionName', () => {
  it('mengembalikan nama divisi untuk id yang dikenal', () => {
    expect(divisionName('div_it')).toBe('IT');
  });

  it('mengembalikan "—" untuk id null', () => {
    expect(divisionName(null)).toBe('—');
  });

  it('mengembalikan id apa adanya untuk id yang tidak dikenal', () => {
    expect(divisionName('div_xx')).toBe('div_xx');
  });
});

describe('projectName', () => {
  it('mengembalikan nama project untuk id yang dikenal', () => {
    expect(projectName('prj_01')).toBe('Sistem Absensi Mahasiswa');
  });

  it('mengembalikan id apa adanya untuk id yang tidak dikenal', () => {
    expect(projectName('prj_99')).toBe('prj_99');
  });
});

describe('formatFileSize', () => {
  it('menampilkan KB untuk ukuran di bawah 1 MB', () => {
    expect(formatFileSize(245760)).toBe('240 KB');
  });

  it('menampilkan MB dengan satu desimal untuk ukuran 1 MB ke atas', () => {
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });

  it('membulatkan KB ke bilangan bulat terdekat', () => {
    expect(formatFileSize(1536)).toBe('2 KB');
  });
});

describe('isOverdue', () => {
  const base: Task = {
    id: 'tsk_x',
    projectId: 'prj_01',
    parentTaskId: null,
    title: 'Contoh',
    description: '',
    status: 'ASSIGNED',
    priority: 'P3',
    deadline: '2026-11-03',
    divisionId: null,
    assigneeId: null,
  };

  it('true untuk deadline lewat dari 2026-11-04 dan status belum selesai', () => {
    expect(isOverdue(base)).toBe(true);
  });

  it('false untuk deadline di masa depan', () => {
    expect(isOverdue({ ...base, deadline: '2026-11-05' })).toBe(false);
  });

  it('false untuk task COMPLETED meski deadline lewat', () => {
    expect(isOverdue({ ...base, status: 'COMPLETED' })).toBe(false);
  });

  it('false untuk task CANCELLED meski deadline lewat', () => {
    expect(isOverdue({ ...base, status: 'CANCELLED' })).toBe(false);
  });
});
