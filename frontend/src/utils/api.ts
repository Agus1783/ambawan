import type {
  Priority,
  Task,
  TaskStatus,
} from '../interfaces/types';

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

/** Field dasar project (spec v2 §13). */
export interface ProjectBase {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  deadline: string | null;
  owner_id: string;
  industry_id: string | null;
  project_template_id: string | null;
}

/** Project dari daftar (GET /projects): membawa jumlah tugas. */
export interface Project extends ProjectBase {
  taskCount: number;
  completedTaskCount: number;
}

/** Tugas di dalam detail project (GET /projects/:id). */
export interface ProjectTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  deadline: string | null;
  assignee_id: string | null;
  parent_task_id: string | null;
  division_id: string | null;
}

/** Detail project: project + daftar tugasnya. */
export interface ProjectDetail extends ProjectBase {
  tasks: ProjectTask[];
}

/** Hasil buat project: project + jumlah tugas yang dibuat dari template. */
export interface CreatedProject extends ProjectBase {
  createdTasks: number;
}

/** Template proyek (spec v2 §13.8): sistem (workspace_id null) atau kustom. */
export interface ProjectTemplate {
  id: string;
  industry_id: string | null;
  workspace_id: string | null;
  name: string;
  description: string | null;
  is_system: boolean;
}

/** Satu template tugas di pratinjau (GET /projects/templates/:id/tasks). */
export interface TemplateTaskPreview {
  id: string;
  parent_template_id: string | null;
  title: string;
  description: string | null;
  priority: string;
  sort_order: number;
}

/** Pratinjau tugas dari satu template proyek. */
export interface TemplateTasksPreview {
  id: string;
  name: string;
  tasks: TemplateTaskPreview[];
}

// --- Tugas (spec v2 §14) ---

/** Satu task dari daftar (GET /tasks): tanpa deskripsi & parent. */
export interface ApiTask {
  id: string;
  workspace_id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  deadline: string | null;
  project: { id: string; name: string } | null;
  division: { id: string; name: string } | null;
  assignee: { id: string; name: string } | null;
}

/** Detail task (GET /tasks/:id): item daftar + deskripsi & parent. */
export interface ApiTaskDetail extends ApiTask {
  description: string | null;
  parentTask: { id: string; title: string } | null;
}

/** Hasil buat task (POST /tasks): hanya field ringkas. */
export interface CreatedTask {
  id: string;
  workspace_id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
}

/** Subtask (GET /tasks/:id/subtasks, spec v2 §14.8). */
export interface ApiSubtask {
  id: string;
  title: string;
  status: TaskStatus;
  assignee: { id: string; name: string } | null;
}

/** Hasil ubah status (PUT /tasks/:id/status, spec v2 §14.6). */
export interface UpdatedTaskStatus {
  id: string;
  status: TaskStatus;
}

/** Hasil delegasi (POST /tasks/:id/delegate, spec v2 §14.7). */
export interface DelegatedTask {
  id: string;
  division: { id: string; name: string } | null;
  assignee: { id: string; name: string } | null;
}

/** Body delegasi: tepat satu dari assignee_id / division_id. */
export interface DelegateTaskInput {
  assignee_id?: string;
  division_id?: string;
}

/** Body buat task (POST /tasks, spec v2 §14.2). */
export interface CreateTaskInput {
  workspace_id: string;
  project_id: string;
  parent_task_id?: string;
  title: string;
  description?: string;
  priority: Priority;
  deadline?: string;
  assignee_id?: string;
  division_id?: string;
}

/**
 * Petakan item task API ke tipe `Task` lokal (dipakai halaman lain).
 * Daftar tidak membawa deskripsi/parent, jadi keduanya kosong di sini.
 */
export function taskFromApiTask(item: ApiTask): Task {
  return {
    id: item.id,
    projectId: item.project?.id ?? '',
    parentTaskId: null,
    title: item.title,
    description: '',
    status: item.status,
    priority: item.priority,
    deadline: item.deadline ?? '',
    divisionId: item.division?.id ?? null,
    assigneeId: item.assignee?.id ?? null,
  };
}

/** Petakan detail task API ke tipe `Task` lokal. */
export function taskFromApiTaskDetail(detail: ApiTaskDetail): Task {
  return {
    ...taskFromApiTask(detail),
    description: detail.description ?? '',
    parentTaskId: detail.parentTask?.id ?? null,
  };
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
    if (error.code === 'PROJECT_NOT_FOUND') {
      return 'Project tidak ditemukan.';
    }
    if (error.code === 'TEMPLATE_NOT_FOUND') {
      return 'Template proyek tidak ditemukan.';
    }
    if (error.code === 'TASK_NOT_FOUND') {
      return 'Task tidak ditemukan.';
    }
    if (error.code === 'INVALID_TASK_STATUS') {
      return 'Status task tidak valid.';
    }
    if (error.code === 'INVALID_DELEGATION') {
      return 'Delegasi harus ke satu user atau satu divisi yang merupakan anggota workspace ini.';
    }
    if (error.code === 'USER_NOT_FOUND') {
      return 'Pengguna tidak ditemukan di workspace ini.';
    }
    if (error.code === 'DIVISION_NOT_FOUND') {
      return 'Divisi tidak ditemukan di workspace ini.';
    }
    if (error.code === 'FORBIDDEN') {
      return 'Kamu tidak punya izin untuk aksi ini.';
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

  // DELETE berhasil (204) tidak membawa body JSON.
  if (response.status === 204) {
    return undefined as T;
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

// --- Proyek & template (spec v2 §13) ---

async function listProjects(workspaceId: string): Promise<Project[]> {
  // Limit 100 = maksimal backend; pagination belum dipakai halaman ini.
  const query = new URLSearchParams({
    workspace_id: workspaceId,
    limit: '100',
  });
  return get<Project[]>(`/projects?${query.toString()}`);
}

async function createProject(input: {
  workspace_id: string;
  name: string;
  description?: string;
  deadline?: string;
  project_template_id?: string;
}): Promise<CreatedProject> {
  return post<CreatedProject>('/projects', input);
}

async function getProject(id: string): Promise<ProjectDetail> {
  return get<ProjectDetail>(`/projects/${id}`);
}

async function deleteProject(id: string): Promise<void> {
  await request<void>(`/projects/${id}`, { method: 'DELETE' });
}

async function listProjectTemplates(
  workspaceId: string,
): Promise<ProjectTemplate[]> {
  return get<ProjectTemplate[]>(
    `/workspaces/${workspaceId}/project-templates`,
  );
}

async function getTemplateTasksPreview(
  templateId: string,
): Promise<TemplateTasksPreview> {
  return get<TemplateTasksPreview>(`/projects/templates/${templateId}/tasks`);
}

// --- Tugas (spec v2 §14) ---

async function listTasks(workspaceId: string): Promise<ApiTask[]> {
  // Limit 100 = maksimal backend; pagination belum dipakai halaman ini.
  const query = new URLSearchParams({
    workspace_id: workspaceId,
    limit: '100',
  });
  return get<ApiTask[]>(`/tasks?${query.toString()}`);
}

async function createTask(input: CreateTaskInput): Promise<CreatedTask> {
  return post<CreatedTask>('/tasks', input);
}

async function getTask(id: string): Promise<ApiTaskDetail> {
  return get<ApiTaskDetail>(`/tasks/${id}`);
}

async function updateTaskStatus(
  id: string,
  status: TaskStatus,
): Promise<UpdatedTaskStatus> {
  return request<UpdatedTaskStatus>(`/tasks/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

async function deleteTask(id: string): Promise<void> {
  await request<void>(`/tasks/${id}`, { method: 'DELETE' });
}

async function delegateTask(
  id: string,
  input: DelegateTaskInput,
): Promise<DelegatedTask> {
  return post<DelegatedTask>(`/tasks/${id}/delegate`, input);
}

async function listSubtasks(id: string): Promise<ApiSubtask[]> {
  return get<ApiSubtask[]>(`/tasks/${id}/subtasks`);
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
  listProjects,
  createProject,
  getProject,
  deleteProject,
  listProjectTemplates,
  getTemplateTasksPreview,
  listTasks,
  createTask,
  getTask,
  updateTaskStatus,
  deleteTask,
  delegateTask,
  listSubtasks,
};

export default api;
