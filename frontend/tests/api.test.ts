import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api, {
  ApiError,
  pesanErrorApi,
  taskFromApiTask,
  taskFromApiTaskDetail,
} from '../src/utils/api';

const user = {
  id: 'usr_01',
  name: 'Budi Santoso',
  email: 'budi@ambado.id',
  auth_provider: 'EMAIL',
  onboarding_completed: false,
};

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('api client', () => {
  beforeEach(() => {
    localStorage.clear();
    api.onUnauthorized(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('login sukses menyimpan accessToken dan mengembalikan user', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Login berhasil',
      data: { user, accessToken: 'tok123' },
    });

    const result = await api.login({
      email: 'budi@ambado.id',
      password: 'rahasia123',
    });

    expect(result.user).toEqual(user);
    expect(result.accessToken).toBe('tok123');
    expect(localStorage.getItem('accessToken')).toBe('tok123');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'budi@ambado.id',
          password: 'rahasia123',
        }),
      }),
    );
  });

  it('login gagal 401 melempar ApiError INVALID_CREDENTIALS tanpa menyimpan token', async () => {
    mockFetch(401, {
      success: false,
      message: 'Email atau password salah',
      error: { code: 'INVALID_CREDENTIALS', details: null },
    });

    await expect(
      api.login({ email: 'budi@ambado.id', password: 'salah' }),
    ).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      status: 401,
    });
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('register mengirim body yang benar dan tidak menyimpan token', async () => {
    const fetchMock = mockFetch(201, {
      success: true,
      message: 'Registrasi berhasil',
      data: user,
    });

    const result = await api.register({
      name: 'Budi Santoso',
      email: 'budi@ambado.id',
      password: 'rahasia123',
    });

    expect(result).toEqual(user);
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/auth/register',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('me mengirim header Authorization Bearer', async () => {
    api.putAccessToken('tok123');
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Data user berhasil diambil',
      data: user,
    });

    await api.me();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/auth/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer tok123',
        }),
      }),
    );
  });

  it('401 pada request ber-token menghapus token dan memanggil onUnauthorized', async () => {
    api.putAccessToken('tok-lama');
    const handler = vi.fn();
    api.onUnauthorized(handler);
    mockFetch(401, {
      success: false,
      message: 'Unauthorized',
      error: { code: 'UNAUTHORIZED', details: null },
    });

    await expect(api.me()).rejects.toBeInstanceOf(ApiError);
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('fetch gagal melempar ApiError NETWORK_ERROR', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('boom')),
    );

    await expect(
      api.login({ email: 'budi@ambado.id', password: 'rahasia123' }),
    ).rejects.toMatchObject({ code: 'NETWORK_ERROR', status: 0 });
  });

  it('pesanErrorApi memetakan kode ke pesan Indonesia', () => {
    expect(
      pesanErrorApi(new ApiError('x', 401, 'INVALID_CREDENTIALS')),
    ).toBe('Email atau password salah.');
    expect(
      pesanErrorApi(new ApiError('x', 409, 'EMAIL_ALREADY_EXISTS')),
    ).toBe('Email sudah digunakan.');
    expect(pesanErrorApi(new ApiError('x', 0, 'NETWORK_ERROR'))).toBe(
      'Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.',
    );
  });
});

describe('api workspace & industri (langkah 2)', () => {
  const workspace = {
    id: 'ws_01',
    name: 'PT Maju Bersama',
    industry: { id: 'ind_01', name: 'Software House' },
    owner_id: 'usr_01',
    is_owner: true,
    role: { id: 'rol_owner', name: 'OWNER', is_system: true },
  };

  beforeEach(() => {
    localStorage.clear();
    api.onUnauthorized(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('listWorkspaces GET /workspaces mengembalikan daftar + role', async () => {
    api.putAccessToken('tok123');
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Data workspace berhasil diambil',
      data: [workspace],
    });

    const result = await api.listWorkspaces();

    expect(result).toEqual([workspace]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/workspaces',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer tok123',
        }),
      }),
    );
  });

  it('createWorkspace POST /workspaces dan menandai pembuat sebagai pemilik', async () => {
    const fetchMock = mockFetch(201, {
      success: true,
      message: 'Workspace berhasil dibuat',
      data: {
        id: 'ws_01',
        name: 'PT Maju Bersama',
        industry: { id: 'ind_01', name: 'Software House' },
        owner_id: 'usr_01',
        role: { id: 'rol_owner', name: 'OWNER', is_system: true },
      },
    });

    const result = await api.createWorkspace({
      name: 'PT Maju Bersama',
      industry_id: 'ind_01',
    });

    expect(result.is_owner).toBe(true);
    expect(result.role.name).toBe('OWNER');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/workspaces',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'PT Maju Bersama',
          industry_id: 'ind_01',
        }),
      }),
    );
  });

  it('createWorkspace kedua melempar WORKSPACE_LIMIT_REACHED', async () => {
    mockFetch(409, {
      success: false,
      message: 'User sudah memiliki satu workspace',
      error: { code: 'WORKSPACE_LIMIT_REACHED', details: null },
    });

    await expect(
      api.createWorkspace({ name: 'Satu Lagi', industry_id: 'ind_01' }),
    ).rejects.toMatchObject({
      code: 'WORKSPACE_LIMIT_REACHED',
      status: 409,
    });
    expect(pesanErrorApi(new ApiError('x', 409, 'WORKSPACE_LIMIT_REACHED'))).toBe(
      'Kamu sudah memiliki satu workspace.',
    );
  });

  it('getWorkspace GET /workspaces/:id', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Data workspace berhasil diambil',
      data: { ...workspace, memberCount: 3 },
    });

    const result = await api.getWorkspace('ws_01');

    expect(result.memberCount).toBe(3);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/workspaces/ws_01',
      expect.anything(),
    );
  });

  it('listIndustries GET /industries', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Data bidang usaha berhasil diambil',
      data: [
        {
          id: 'ind_01',
          name: 'Software House',
          description: null,
          is_system: true,
        },
      ],
    });

    const result = await api.listIndustries();

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Software House');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/industries',
      expect.anything(),
    );
  });

  it('createIndustry POST /industries', async () => {
    const fetchMock = mockFetch(201, {
      success: true,
      message: 'Bidang usaha berhasil ditambahkan',
      data: {
        id: 'ind_99',
        name: 'Rumah Makan',
        description: 'Kuliner',
        is_system: false,
      },
    });

    const result = await api.createIndustry({
      name: 'Rumah Makan',
      description: 'Kuliner',
    });

    expect(result.id).toBe('ind_99');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/industries',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Rumah Makan', description: 'Kuliner' }),
      }),
    );
  });

  it('getProjectSuggestions GET /industries/:id/project-suggestions', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Saran proyek berhasil diambil',
      data: [
        {
          id: 'tpl_01',
          name: 'Aplikasi Absensi Siswa',
          description: 'Template proyek absensi',
          industry: { id: 'ind_01', name: 'Software House' },
        },
      ],
    });

    const result = await api.getProjectSuggestions('ind_01');

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Aplikasi Absensi Siswa');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/industries/ind_01/project-suggestions',
      expect.anything(),
    );
  });
});

describe('api proyek & template (langkah 3)', () => {
  const project = {
    id: 'prj_01',
    workspace_id: 'ws_01',
    name: 'Sistem Absensi Mahasiswa',
    description: 'Pengembangan sistem absensi berbasis QR.',
    deadline: '2026-11-30T00:00:00.000Z',
    owner_id: 'usr_01',
    industry_id: 'ind_01',
    project_template_id: null,
    taskCount: 4,
    completedTaskCount: 1,
  };

  it('listProjects GET /projects?workspace_id=...&limit=100', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Data project berhasil diambil',
      data: [project],
    });

    const result = await api.listProjects('ws_01');

    expect(result).toEqual([project]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/projects?workspace_id=ws_01&limit=100',
      expect.anything(),
    );
  });

  it('createProject POST /projects mengembalikan project + createdTasks', async () => {
    const fetchMock = mockFetch(201, {
      success: true,
      message: 'Project berhasil dibuat',
      data: { ...project, project_template_id: 'tpl_01', createdTasks: 3 },
    });

    const result = await api.createProject({
      workspace_id: 'ws_01',
      name: 'Sistem Absensi Mahasiswa',
      description: 'Pengembangan sistem absensi berbasis QR.',
      deadline: '2026-11-30T00:00:00.000Z',
      project_template_id: 'tpl_01',
    });

    expect(result.createdTasks).toBe(3);
    expect(result.project_template_id).toBe('tpl_01');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/projects',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          workspace_id: 'ws_01',
          name: 'Sistem Absensi Mahasiswa',
          description: 'Pengembangan sistem absensi berbasis QR.',
          deadline: '2026-11-30T00:00:00.000Z',
          project_template_id: 'tpl_01',
        }),
      }),
    );
  });

  it('getProject GET /projects/:id mengembalikan detail + tugas', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Data project berhasil diambil',
      data: {
        ...project,
        taskCount: undefined,
        completedTaskCount: undefined,
        tasks: [
          {
            id: 'tsk_01',
            title: 'Membuat API Login',
            description: 'Implementasi endpoint POST /auth/login.',
            status: 'IN_PROGRESS',
            priority: 'P1',
            deadline: '2026-11-05T00:00:00.000Z',
            assignee_id: null,
            parent_task_id: null,
            division_id: null,
          },
        ],
      },
    });

    const result = await api.getProject('prj_01');

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]?.title).toBe('Membuat API Login');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/projects/prj_01',
      expect.anything(),
    );
  });

  it('deleteProject DELETE /projects/:id berhasil pada 204 tanpa body', async () => {
    // Respons 204 tidak punya body: response.json() melempar — client
    // tidak boleh mencoba membacanya.
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => {
        throw new SyntaxError('Unexpected end of JSON input');
      },
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.deleteProject('prj_01')).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/projects/prj_01',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('listProjectTemplates GET /workspaces/:id/project-templates', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Template proyek berhasil diambil',
      data: [
        {
          id: 'tpl_01',
          industry_id: 'ind_01',
          workspace_id: null,
          name: 'Aplikasi Absensi Siswa',
          description: 'Template proyek absensi',
          is_system: true,
        },
      ],
    });

    const result = await api.listProjectTemplates('ws_01');

    expect(result).toHaveLength(1);
    expect(result[0]?.is_system).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/workspaces/ws_01/project-templates',
      expect.anything(),
    );
  });

  it('getTemplateTasksPreview GET /projects/templates/:id/tasks', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Template tugas berhasil diambil',
      data: {
        id: 'tpl_01',
        name: 'Aplikasi Absensi Siswa',
        tasks: [
          {
            id: 'tt_01',
            parent_template_id: null,
            title: 'Analisis kebutuhan',
            description: null,
            priority: 'P1',
            sort_order: 0,
          },
        ],
      },
    });

    const result = await api.getTemplateTasksPreview('tpl_01');

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]?.title).toBe('Analisis kebutuhan');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/projects/templates/tpl_01/tasks',
      expect.anything(),
    );
  });

  it('pesanErrorApi PROJECT_NOT_FOUND dan TEMPLATE_NOT_FOUND', () => {
    expect(
      pesanErrorApi(new ApiError('Project tidak ditemukan', 404, 'PROJECT_NOT_FOUND')),
    ).toBe('Project tidak ditemukan.');
    expect(
      pesanErrorApi(
        new ApiError('Template proyek tidak ditemukan', 404, 'TEMPLATE_NOT_FOUND'),
      ),
    ).toBe('Template proyek tidak ditemukan.');
  });
});

describe('api tugas (langkah 4)', () => {
  const apiTask = {
    id: 'tsk_01',
    workspace_id: 'ws_01',
    title: 'Membuat API Login',
    status: 'IN_PROGRESS',
    priority: 'P1',
    deadline: '2026-10-01T23:59:59.000Z',
    project: { id: 'prj_01', name: 'Sistem Absensi' },
    division: { id: 'div_it', name: 'IT' },
    assignee: { id: 'usr_02', name: 'Andi' },
  };

  it('listTasks GET /tasks?workspace_id=...&limit=100', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Data task berhasil diambil',
      data: [apiTask],
    });

    const result = await api.listTasks('ws_01');

    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe('Membuat API Login');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/tasks?workspace_id=ws_01&limit=100',
      expect.anything(),
    );
  });

  it('createTask POST /tasks mengembalikan task ringkas (201)', async () => {
    const fetchMock = mockFetch(201, {
      success: true,
      message: 'Task berhasil dibuat',
      data: {
        id: 'tsk_02',
        workspace_id: 'ws_01',
        title: 'Membuat endpoint login',
        status: 'ASSIGNED',
        priority: 'P1',
      },
    });

    const result = await api.createTask({
      workspace_id: 'ws_01',
      project_id: 'prj_01',
      title: 'Membuat endpoint login',
      description: 'Implementasi endpoint POST /auth/login',
      priority: 'P1',
      deadline: '2026-10-01T00:00:00.000Z',
      assignee_id: 'usr_02',
    });

    expect(result.id).toBe('tsk_02');
    expect(result.status).toBe('ASSIGNED');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/tasks',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          workspace_id: 'ws_01',
          project_id: 'prj_01',
          title: 'Membuat endpoint login',
          description: 'Implementasi endpoint POST /auth/login',
          priority: 'P1',
          deadline: '2026-10-01T00:00:00.000Z',
          assignee_id: 'usr_02',
        }),
      }),
    );
  });

  it('getTask GET /tasks/:id mengembalikan detail + parent', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Data task berhasil diambil',
      data: {
        ...apiTask,
        description: 'Membuat endpoint authentication',
        parentTask: { id: 'tsk_00', title: 'Modul Auth' },
      },
    });

    const result = await api.getTask('tsk_01');

    expect(result.description).toBe('Membuat endpoint authentication');
    expect(result.parentTask?.id).toBe('tsk_00');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/tasks/tsk_01',
      expect.anything(),
    );
  });

  it('taskFromApiTask memetakan relasi bersarang ke field datar', () => {
    const mapped = taskFromApiTask(apiTask as never);

    expect(mapped).toMatchObject({
      id: 'tsk_01',
      projectId: 'prj_01',
      parentTaskId: null,
      title: 'Membuat API Login',
      description: '',
      status: 'IN_PROGRESS',
      priority: 'P1',
      deadline: '2026-10-01T23:59:59.000Z',
      divisionId: 'div_it',
      assigneeId: 'usr_02',
    });
  });

  it('taskFromApiTask menangani relasi null (deadline kosong, bukan null)', () => {
    const mapped = taskFromApiTask({
      ...apiTask,
      deadline: null,
      project: null,
      division: null,
      assignee: null,
    } as never);

    expect(mapped.projectId).toBe('');
    expect(mapped.divisionId).toBeNull();
    expect(mapped.assigneeId).toBeNull();
    expect(mapped.deadline).toBe('');
  });

  it('taskFromApiTaskDetail mengisi deskripsi dan parent', () => {
    const mapped = taskFromApiTaskDetail({
      ...apiTask,
      description: 'Membuat endpoint authentication',
      parentTask: { id: 'tsk_00', title: 'Modul Auth' },
    } as never);

    expect(mapped.description).toBe('Membuat endpoint authentication');
    expect(mapped.parentTaskId).toBe('tsk_00');
  });

  it('pesanErrorApi TASK_NOT_FOUND, USER_NOT_FOUND, DIVISION_NOT_FOUND', () => {
    expect(
      pesanErrorApi(new ApiError('Task tidak ditemukan', 404, 'TASK_NOT_FOUND')),
    ).toBe('Task tidak ditemukan.');
    expect(
      pesanErrorApi(new ApiError('User tidak ditemukan', 404, 'USER_NOT_FOUND')),
    ).toBe('Pengguna tidak ditemukan di workspace ini.');
    expect(
      pesanErrorApi(
        new ApiError('Division tidak ditemukan', 404, 'DIVISION_NOT_FOUND'),
      ),
    ).toBe('Divisi tidak ditemukan di workspace ini.');
  });
});

describe('api tugas (2) — status, subtask, delegasi, hapus (langkah 5)', () => {
  it('updateTaskStatus PUT /tasks/:id/status mengirim status dan mengembalikan id + status', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Status task berhasil diperbarui',
      data: { id: 'tsk_01', status: 'IN_PROGRESS' },
    });

    const result = await api.updateTaskStatus('tsk_01', 'IN_PROGRESS');

    expect(result).toEqual({ id: 'tsk_01', status: 'IN_PROGRESS' });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/tasks/tsk_01/status',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      }),
    );
  });

  it('listSubtasks GET /tasks/:id/subtasks mengembalikan daftar subtask', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Subtask berhasil diambil',
      data: [
        {
          id: 'tsk_02',
          title: 'Membuat skema tabel user',
          status: 'ASSIGNED',
          assignee: { id: 'usr_02', name: 'Andi' },
        },
        {
          id: 'tsk_03',
          title: 'Menulis test login',
          status: 'BACKLOG',
          assignee: null,
        },
      ],
    });

    const result = await api.listSubtasks('tsk_01');

    expect(result).toHaveLength(2);
    expect(result[1]?.assignee).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/tasks/tsk_01/subtasks',
      expect.anything(),
    );
  });

  it('createTask dengan parent_task_id mengirim parent untuk membuat subtask', async () => {
    const fetchMock = mockFetch(201, {
      success: true,
      message: 'Task berhasil dibuat',
      data: {
        id: 'tsk_02',
        workspace_id: 'ws_01',
        title: 'Membuat skema tabel user',
        status: 'ASSIGNED',
        priority: 'P3',
      },
    });

    const result = await api.createTask({
      workspace_id: 'ws_01',
      project_id: 'prj_01',
      parent_task_id: 'tsk_01',
      title: 'Membuat skema tabel user',
      priority: 'P3',
    });

    expect(result.id).toBe('tsk_02');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/tasks',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          workspace_id: 'ws_01',
          project_id: 'prj_01',
          parent_task_id: 'tsk_01',
          title: 'Membuat skema tabel user',
          priority: 'P3',
        }),
      }),
    );
  });

  it('delegateTask POST /tasks/:id/delegate ke user mengembalikan assignee baru', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Task berhasil didelegasikan',
      data: {
        id: 'tsk_01',
        division: null,
        assignee: { id: 'usr_03', name: 'Citra' },
      },
    });

    const result = await api.delegateTask('tsk_01', {
      assignee_id: 'usr_03',
    });

    expect(result.assignee?.name).toBe('Citra');
    expect(result.division).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/tasks/tsk_01/delegate',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ assignee_id: 'usr_03' }),
      }),
    );
  });

  it('delegateTask POST /tasks/:id/delegate ke divisi mengembalikan division baru', async () => {
    mockFetch(200, {
      success: true,
      message: 'Task berhasil didelegasikan',
      data: {
        id: 'tsk_01',
        division: { id: 'div_it', name: 'IT' },
        assignee: null,
      },
    });

    const result = await api.delegateTask('tsk_01', {
      division_id: 'div_it',
    });

    expect(result.division?.name).toBe('IT');
    expect(result.assignee).toBeNull();
  });

  it('deleteTask DELETE /tasks/:id berhasil pada 204 tanpa body', async () => {
    const fetchMock = mockFetch(204, null);

    await expect(api.deleteTask('tsk_01')).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/tasks/tsk_01',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('pesanErrorApi INVALID_TASK_STATUS dan INVALID_DELEGATION', () => {
    expect(
      pesanErrorApi(
        new ApiError('Status task tidak valid', 400, 'INVALID_TASK_STATUS'),
      ),
    ).toBe('Status task tidak valid.');
    expect(
      pesanErrorApi(
        new ApiError(
          'Delegasi harus ke satu user atau satu division',
          400,
          'INVALID_DELEGATION',
        ),
      ),
    ).toBe(
      'Delegasi harus ke satu user atau satu divisi yang merupakan anggota workspace ini.',
    );
  });
});

describe('api divisi, anggota & undangan (langkah 6)', () => {
  const division = {
    id: 'div_it',
    workspace_id: 'ws_01',
    name: 'IT',
    leader: { id: 'usr_01', name: 'Budi Santoso' },
    memberCount: 2,
  };

  const member = {
    id: 'usr_02',
    name: 'Andi Pratama',
    email: 'andi@ambado.id',
    role: { id: 'rol_member', name: 'MEMBER', is_system: true },
  };

  const invitation = {
    id: 'inv_01',
    workspace_id: 'ws_01',
    project_id: null,
    email: 'sinta@ambado.id',
    role: { id: 'rol_member', name: 'MEMBER', is_system: true },
    status: 'PENDING',
    invited_by: { id: 'usr_01', name: 'Budi Santoso' },
    expires_at: '2026-11-29T00:00:00.000Z',
  };

  it('listDivisions GET /divisions?workspace_id=...&limit=100', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Data division berhasil diambil',
      data: [division],
    });

    const result = await api.listDivisions('ws_01');

    expect(result).toEqual([division]);
    expect(result[0]?.memberCount).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/divisions?workspace_id=ws_01&limit=100',
      expect.anything(),
    );
  });

  it('createDivision POST /divisions mengembalikan divisi (memberCount 0)', async () => {
    const fetchMock = mockFetch(201, {
      success: true,
      message: 'Division berhasil dibuat',
      data: {
        id: 'div_it',
        workspace_id: 'ws_01',
        name: 'IT',
        leader: null,
      },
    });

    const result = await api.createDivision({
      workspace_id: 'ws_01',
      name: 'IT',
    });

    expect(result.name).toBe('IT');
    expect(result.leader).toBeNull();
    expect(result.memberCount).toBe(0);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/divisions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ workspace_id: 'ws_01', name: 'IT' }),
      }),
    );
  });

  it('getDivision GET /divisions/:id mengembalikan detail + anggota', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Data division berhasil diambil',
      data: {
        ...division,
        members: [
          {
            id: 'usr_01',
            name: 'Budi Santoso',
            role: { id: 'rol_leader', name: 'DIVISION_LEADER', is_system: true },
          },
        ],
      },
    });

    const result = await api.getDivision('div_it');

    expect(result.members).toHaveLength(1);
    expect(result.members[0]?.role.name).toBe('DIVISION_LEADER');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/divisions/div_it',
      expect.anything(),
    );
  });

  it('setDivisionLeader PUT /divisions/:id/leader mengirim user_id', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Ketua division berhasil ditetapkan',
      data: {
        division_id: 'div_it',
        leader: { id: 'usr_01', name: 'Budi Santoso' },
      },
    });

    const result = await api.setDivisionLeader('div_it', 'usr_01');

    expect(result.leader.name).toBe('Budi Santoso');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/divisions/div_it/leader',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ user_id: 'usr_01' }),
      }),
    );
  });

  it('listWorkspaceMembers GET /workspaces/:id/members?limit=100', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Anggota workspace berhasil diambil',
      data: [member],
    });

    const result = await api.listWorkspaceMembers('ws_01');

    expect(result).toEqual([member]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/workspaces/ws_01/members?limit=100',
      expect.anything(),
    );
  });

  it('updateMemberRole PUT /workspaces/:id/members/:userId/role mengirim role_id', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Role anggota berhasil diperbarui',
      data: {
        ...member,
        role: { id: 'rol_manager', name: 'MANAGER', is_system: true },
      },
    });

    const result = await api.updateMemberRole(
      'ws_01',
      'usr_02',
      'rol_manager',
    );

    expect(result.role.name).toBe('MANAGER');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/workspaces/ws_01/members/usr_02/role',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ role_id: 'rol_manager' }),
      }),
    );
  });

  it('removeMember DELETE /workspaces/:id/members/:userId berhasil pada 204', async () => {
    const fetchMock = mockFetch(204, null);

    await expect(api.removeMember('ws_01', 'usr_02')).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/workspaces/ws_01/members/usr_02',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('listWorkspaceRoles GET /workspaces/:id/roles', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Data role berhasil diambil',
      data: [
        {
          id: 'rol_owner',
          name: 'OWNER',
          description: 'Pemilik workspace',
          is_system: true,
          permissions: ['workspace.view'],
        },
      ],
    });

    const result = await api.listWorkspaceRoles('ws_01');

    expect(result).toHaveLength(1);
    expect(result[0]?.is_system).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/workspaces/ws_01/roles',
      expect.anything(),
    );
  });

  it('listInvitations GET /workspaces/:id/invitations?limit=100', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Data undangan berhasil diambil',
      data: [invitation],
    });

    const result = await api.listInvitations('ws_01');

    expect(result).toEqual([invitation]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/workspaces/ws_01/invitations?limit=100',
      expect.anything(),
    );
  });

  it('createInvitation POST /workspaces/:id/invitations mengirim email + role_id', async () => {
    const fetchMock = mockFetch(201, {
      success: true,
      message: 'Undangan berhasil dikirim',
      data: {
        id: 'inv_01',
        workspace_id: 'ws_01',
        project_id: null,
        email: 'sinta@ambado.id',
        role: { id: 'rol_member', name: 'MEMBER', is_system: true },
        status: 'PENDING',
        expires_at: '2026-11-29T00:00:00.000Z',
      },
    });

    const result = await api.createInvitation('ws_01', {
      email: 'sinta@ambado.id',
      role_id: 'rol_member',
    });

    expect(result.status).toBe('PENDING');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/workspaces/ws_01/invitations',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'sinta@ambado.id',
          role_id: 'rol_member',
        }),
      }),
    );
  });

  it('resendInvitation POST /invitations/:id/resend mengembalikan baris baru', async () => {
    const fetchMock = mockFetch(201, {
      success: true,
      message: 'Undangan berhasil dikirim ulang',
      data: {
        id: 'inv_02',
        email: 'sinta@ambado.id',
        status: 'PENDING',
        expires_at: '2026-11-29T00:00:00.000Z',
      },
    });

    const result = await api.resendInvitation('inv_01');

    expect(result.id).toBe('inv_02');
    expect(result.status).toBe('PENDING');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/invitations/inv_01/resend',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('pesanErrorApi kode baru divisi/anggota/undangan', () => {
    expect(
      pesanErrorApi(new ApiError('Role tidak ditemukan', 404, 'ROLE_NOT_FOUND')),
    ).toBe('Role tidak ditemukan.');
    expect(
      pesanErrorApi(
        new ApiError(
          'Role kustom bukan milik workspace ini',
          403,
          'ROLE_NOT_IN_WORKSPACE',
        ),
      ),
    ).toBe('Role bukan milik workspace ini.');
    expect(
      pesanErrorApi(
        new ApiError('Undangan tidak ditemukan', 404, 'INVITATION_INVALID'),
      ),
    ).toBe('Undangan tidak ditemukan.');
    expect(
      pesanErrorApi(
        new ApiError('Undangan sudah kedaluwarsa', 400, 'INVITATION_EXPIRED'),
      ),
    ).toBe('Undangan sudah kedaluwarsa.');
  });

  it('pesanErrorApi RESOURCE_CONFLICT memakai pesan spesifik server', () => {
    expect(
      pesanErrorApi(
        new ApiError(
          'Email sudah menjadi anggota workspace ini',
          409,
          'RESOURCE_CONFLICT',
        ),
      ),
    ).toBe('Email sudah menjadi anggota workspace ini');
    expect(
      pesanErrorApi(
        new ApiError(
          'Nama division sudah dipakai di workspace ini',
          409,
          'RESOURCE_CONFLICT',
        ),
      ),
    ).toBe('Nama division sudah dipakai di workspace ini');
  });

  it('listTaskHistory mengembalikan riwayat task dari API', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'History task berhasil diambil',
      data: [
        {
          id: 'hst_01',
          action: 'STATUS_CHANGED',
          oldStatus: 'ASSIGNED',
          newStatus: 'IN_PROGRESS',
          description: null,
          user: { id: 'usr_02', name: 'Andi Pratama' },
          createdAt: '2026-09-27T10:00:00.000Z',
        },
      ],
    });

    const result = await api.listTaskHistory('tsk_01');

    expect(result).toHaveLength(1);
    expect(result[0].action).toBe('STATUS_CHANGED');
    expect(result[0].user?.name).toBe('Andi Pratama');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/tasks/tsk_01/history',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('listAttachments mengembalikan lampiran task dari API', async () => {
    mockFetch(200, {
      success: true,
      message: 'Attachment berhasil diambil',
      data: [
        {
          id: 'att_01',
          fileName: 'api-documentation.pdf',
          fileType: 'application/pdf',
          fileSize: 245760,
          fileUrl: 'https://storage.example.com/att_01.pdf',
        },
        {
          id: 'att_02',
          fileName: 'catatan.txt',
          fileType: 'text/plain',
          fileSize: null,
          fileUrl: 'https://storage.example.com/att_02.txt',
        },
      ],
    });

    const result = await api.listAttachments('tsk_01');

    expect(result).toHaveLength(2);
    expect(result[0].fileName).toBe('api-documentation.pdf');
    expect(result[1].fileSize).toBeNull();
  });

  it('uploadAttachment mengirim FormData field file dan mengembalikan lampiran', async () => {
    const fetchMock = mockFetch(201, {
      success: true,
      message: 'Attachment berhasil diupload',
      data: {
        id: 'att_01',
        fileName: 'dokumen.pdf',
        fileType: 'application/pdf',
        fileSize: 1234,
        fileUrl: 'https://storage.example.com/att_01.pdf',
      },
    });

    const file = new File(['isi'], 'dokumen.pdf', {
      type: 'application/pdf',
    });
    const result = await api.uploadAttachment('tsk_01', file);

    expect(result.id).toBe('att_01');
    expect(result.fileUrl).toBe('https://storage.example.com/att_01.pdf');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/tasks/tsk_01/attachments',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      }),
    );
    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.get('file')).toBe(file);
  });

  it('uploadAttachment gagal 400 FILE_TOO_LARGE melempar ApiError', async () => {
    mockFetch(400, {
      success: false,
      message: 'Ukuran file terlalu besar',
      error: { code: 'FILE_TOO_LARGE', details: null },
    });

    const file = new File(['isi'], 'besar.zip', { type: 'application/zip' });
    await expect(api.uploadAttachment('tsk_01', file)).rejects.toMatchObject({
      code: 'FILE_TOO_LARGE',
      status: 400,
    });
  });

  it('deleteAttachment memanggil DELETE dan mengembalikan void', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Attachment berhasil dihapus',
      data: null,
    });

    await api.deleteAttachment('tsk_01', 'att_01');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/tasks/tsk_01/attachments/att_01',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('listComments mengembalikan komentar task dari API (limit 100)', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Komentar berhasil diambil',
      data: [
        {
          id: 'cmt_01',
          task_id: 'tsk_01',
          content: 'Progress sudah 70%.',
          user: { id: 'usr_02', name: 'Andi Pratama' },
          created_at: '2026-11-01T08:00:00.000Z',
          updated_at: '2026-11-01T08:00:00.000Z',
        },
      ],
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });

    const result = await api.listComments('tsk_01');

    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('Progress sudah 70%.');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/tasks/tsk_01/comments?limit=100',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('createComment mengirim content dan mengembalikan komentar baru', async () => {
    const fetchMock = mockFetch(201, {
      success: true,
      message: 'Komentar berhasil ditambahkan',
      data: {
        id: 'cmt_02',
        task_id: 'tsk_01',
        content: 'Siap direview.',
        user: { id: 'usr_02', name: 'Andi Pratama' },
        created_at: '2026-11-02T09:00:00.000Z',
        updated_at: '2026-11-02T09:00:00.000Z',
      },
    });

    const result = await api.createComment('tsk_01', 'Siap direview.');

    expect(result.id).toBe('cmt_02');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/tasks/tsk_01/comments',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ content: 'Siap direview.' }),
      }),
    );
  });

  it('deleteComment memanggil DELETE dan mengembalikan void', async () => {
    const fetchMock = mockFetch(200, {
      success: true,
      message: 'Komentar berhasil dihapus',
      data: null,
    });

    await api.deleteComment('tsk_01', 'cmt_01');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/tasks/tsk_01/comments/cmt_01',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('pesanErrorApi kode baru lampiran dan komentar', () => {
    expect(
      pesanErrorApi(
        new ApiError('Attachment tidak ditemukan', 404, 'ATTACHMENT_NOT_FOUND'),
      ),
    ).toBe('Lampiran tidak ditemukan.');
    expect(
      pesanErrorApi(
        new ApiError('Komentar tidak ditemukan', 404, 'COMMENT_NOT_FOUND'),
      ),
    ).toBe('Komentar tidak ditemukan.');
    expect(
      pesanErrorApi(
        new ApiError('Tipe file tidak didukung', 400, 'UNSUPPORTED_FILE_TYPE'),
      ),
    ).toBe(
      'Tipe file tidak didukung. Format yang diizinkan: gambar, PDF, dokumen, spreadsheet, teks, atau ZIP.',
    );
    expect(
      pesanErrorApi(
        new ApiError('Ukuran file terlalu besar', 400, 'FILE_TOO_LARGE'),
      ),
    ).toBe('Ukuran file terlalu besar (maksimal 10 MB).');
  });
});
