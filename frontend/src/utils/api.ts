/**
 * API client AmbaDo (spec v2: envelope `{success, message, data, error}`).
 *
 * - Base URL dari `VITE_API_URL`, default `http://localhost:3000/api/v1`.
 * - Access token disimpan di localStorage kunci `accessToken` dan dikirim
 *   sebagai header `Authorization: Bearer <token>`.
 * - Respons gagal melempar `ApiError` dengan `code` + `details` dari server.
 * - 401 pada request yang membawa token berarti sesi berakhir: token dihapus
 *   dan handler `onUnauthorized` dipanggil (App mengarahkannya ke login).
 */

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  auth_provider: 'EMAIL' | 'GOOGLE';
  onboarding_completed: boolean;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
}

/** Bidang usaha (spec v2 §9). */
export interface Industry {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
}

/** Role di dalam workspace (spec v2 §8, §10). */
export interface WorkspaceRole {
  id: string;
  name: string;
  is_system: boolean;
}

/** Workspace yang diikuti user + role-nya di workspace itu (GET /workspaces). */
export interface Workspace {
  id: string;
  name: string;
  industry: { id: string; name: string } | null;
  owner_id: string;
  is_owner: boolean;
  role: WorkspaceRole;
}

/** Detail workspace (GET /workspaces/:id) — tanpa role, ada jumlah anggota. */
export interface WorkspaceDetail {
  id: string;
  name: string;
  industry: { id: string; name: string } | null;
  owner_id: string;
  memberCount: number;
}

/** Saran proyek sistem untuk satu bidang usaha (spec v2 §9.3). */
export interface ProjectSuggestion {
  id: string;
  name: string;
  description: string | null;
  industry: { id: string; name: string };
}

interface Envelope {
  success: boolean;
  message: string;
  data?: unknown;
  error?: {
    code: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;

  constructor(
    message: string,
    status: number,
    code: string,
    details: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Pesan error berbahasa Indonesia untuk ditampilkan di UI. */
export function pesanErrorApi(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'INVALID_CREDENTIALS') {
      return 'Email atau password salah.';
    }
    if (error.code === 'EMAIL_ALREADY_EXISTS') {
      return 'Email sudah digunakan.';
    }
    if (error.code === 'WORKSPACE_LIMIT_REACHED') {
      return 'Kamu sudah memiliki satu workspace.';
    }
    if (error.code === 'INDUSTRY_NOT_FOUND') {
      return 'Bidang usaha tidak ditemukan.';
    }
    if (error.code === 'WORKSPACE_NOT_FOUND') {
      return 'Workspace tidak ditemukan.';
    }
    if (error.code === 'RESOURCE_CONFLICT') {
      return 'Nama itu sudah digunakan.';
    }
    if (error.code === 'VALIDATION_ERROR') {
      return 'Periksa lagi isian form.';
    }
    if (error.code === 'UNAUTHORIZED') {
      return 'Sesi sudah berakhir. Silakan login lagi.';
    }
    if (error.code === 'NETWORK_ERROR') {
      return 'Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.';
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Terjadi kesalahan. Coba lagi.';
}

const API_BASE_URL = (
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:3000/api/v1'
).replace(/\/+$/, '');

const TOKEN_KEY = 'accessToken';

function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

function putAccessToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

function removeAccessToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(TOKEN_KEY);
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Daftarkan (atau kosongkan dengan `null`) handler saat sesi berakhir (401). */
function onUnauthorized(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string> | undefined) ?? {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      'Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.',
      0,
      'NETWORK_ERROR',
    );
  }

  const json = (await response.json().catch(() => null)) as Envelope | null;
  if (!response.ok || !json || json.success !== true) {
    const code =
      json?.error?.code ??
      (response.status === 401 ? 'UNAUTHORIZED' : 'REQUEST_FAILED');
    const message =
      json?.message ?? `Permintaan gagal (HTTP ${response.status})`;
    if (response.status === 401 && token) {
      removeAccessToken();
      unauthorizedHandler?.();
    }
    throw new ApiError(message, response.status, code, json?.error?.details ?? null);
  }
  return json.data as T;
}

function get<T>(path: string): Promise<T> {
  return request<T>(path);
}

function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<PublicUser> {
  return post<PublicUser>('/auth/register', input);
}

async function login(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const result = await post<AuthResult>('/auth/login', input);
  putAccessToken(result.accessToken);
  return result;
}

async function loginWithGoogle(idToken: string): Promise<AuthResult> {
  const result = await post<AuthResult>('/auth/google', {
    id_token: idToken,
  });
  putAccessToken(result.accessToken);
  return result;
}

async function logout(): Promise<void> {
  // Logout stateless di server (spec §6.3): token cukup dibuang client.
  // Panggilan ke server best-effort; token lokal selalu dibersihkan.
  try {
    await post('/auth/logout', {});
  } catch {
    // Abaikan: sesi lokal tetap diakhiri di bawah.
  } finally {
    removeAccessToken();
  }
}

async function me(): Promise<PublicUser> {
  return get<PublicUser>('/auth/me');
}

// --- Workspace (spec v2 §8) ---

async function listWorkspaces(): Promise<Workspace[]> {
  return get<Workspace[]>('/workspaces');
}

async function createWorkspace(input: {
  name: string;
  industry_id: string;
}): Promise<Workspace> {
  // Respons create tidak membawa `is_owner`; pembuat selalu jadi OWNER
  // (backend membuat membership OWNER dalam transaksi yang sama).
  const created = await post<{
    id: string;
    name: string;
    industry: { id: string; name: string } | null;
    owner_id: string;
    role: WorkspaceRole;
  }>('/workspaces', input);
  return { ...created, is_owner: true };
}

async function getWorkspace(id: string): Promise<WorkspaceDetail> {
  return get<WorkspaceDetail>(`/workspaces/${id}`);
}

// --- Industri & saran proyek (spec v2 §9) ---

async function listIndustries(): Promise<Industry[]> {
  return get<Industry[]>('/industries');
}

async function createIndustry(input: {
  name: string;
  description?: string;
}): Promise<Industry> {
  return post<Industry>('/industries', input);
}

async function getProjectSuggestions(
  industryId: string,
): Promise<ProjectSuggestion[]> {
  return get<ProjectSuggestion[]>(
    `/industries/${industryId}/project-suggestions`,
  );
}

const api = {
  getAccessToken,
  putAccessToken,
  removeAccessToken,
  onUnauthorized,
  get,
  post,
  register,
  login,
  loginWithGoogle,
  logout,
  me,
  listWorkspaces,
  createWorkspace,
  getWorkspace,
  listIndustries,
  createIndustry,
  getProjectSuggestions,
};

export default api;
