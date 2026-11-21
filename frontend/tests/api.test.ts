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
