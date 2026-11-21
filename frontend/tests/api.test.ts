import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api, { ApiError, pesanErrorApi } from '../src/utils/api';

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
