import type { Attachment, Division, HistoryItem, Priority, Project, RoleName, Task, TaskStatus, User } from '../interfaces/types';

export const ROLE_LABELS: Record<RoleName, string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  DIVISION_LEADER: 'Ketua Divisi',
  MEMBER: 'Anggota',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  BACKLOG: 'Backlog',
  ASSIGNED: 'Ditugaskan',
  IN_PROGRESS: 'Dikerjakan',
  REVIEW: 'Review',
  COMPLETED: 'Selesai',
  BLOCKED: 'Terhambat',
  CANCELLED: 'Dibatalkan',
};

export const STATUS_CHIP: Record<TaskStatus, string> = {
  BACKLOG: '',
  ASSIGNED: 'bg-mk-blue-soft',
  IN_PROGRESS: 'bg-mk-yellow-soft',
  REVIEW: 'bg-mk-pink-soft',
  COMPLETED: 'bg-mk-green-soft',
  BLOCKED: 'bg-mk-red-soft',
  CANCELLED: '',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  P1: 'P1 - Mendesak',
  P2: 'P2 - Penting',
  P3: 'P3 - Normal',
};

export const CURRENT_USER_ID = 'usr_02';

export const divisions: Division[] = [
  { id: 'div_it', name: 'IT', leaderId: 'usr_01' },
  { id: 'div_mkt', name: 'Marketing', leaderId: 'usr_04' },
  { id: 'div_ops', name: 'Operasional', leaderId: 'usr_05' },
];

export const users: User[] = [
  { id: 'usr_01', name: 'Budi Santoso', email: 'budi@ambado.id', role: 'DIVISION_LEADER', divisionId: 'div_it' },
  { id: 'usr_02', name: 'Andi Pratama', email: 'andi@ambado.id', role: 'MEMBER', divisionId: 'div_it' },
  { id: 'usr_03', name: 'Sinta Maharani', email: 'sinta@ambado.id', role: 'MEMBER', divisionId: 'div_it' },
  { id: 'usr_04', name: 'Rina Wijaya', email: 'rina@ambado.id', role: 'DIVISION_LEADER', divisionId: 'div_mkt' },
  { id: 'usr_05', name: 'Dewi Lestari', email: 'dewi@ambado.id', role: 'DIVISION_LEADER', divisionId: 'div_ops' },
  { id: 'usr_06', name: 'Agus Manager', email: 'agus@ambado.id', role: 'MANAGER', divisionId: 'div_it' },
];

export const projects: Project[] = [
  { id: 'prj_01', name: 'Sistem Absensi Mahasiswa', description: 'Pengembangan sistem absensi berbasis QR untuk kampus.', deadline: '2026-11-30' },
  { id: 'prj_02', name: 'Portal Akademik v2', description: 'Perombakan portal akademik: KRS online dan nilai.', deadline: '2026-12-20' },
  { id: 'prj_03', name: 'Aplikasi Mobile Kampus', description: 'Aplikasi Android/iOS untuk informasi kampus.', deadline: '2027-01-15' },
];

export const tasks: Task[] = [
  { id: 'tsk_01', projectId: 'prj_01', parentTaskId: null, title: 'Membuat API Login', description: 'Implementasi endpoint POST /auth/login dengan JWT dan bcrypt.', status: 'IN_PROGRESS', priority: 'P1', deadline: '2026-11-05', divisionId: 'div_it', assigneeId: 'usr_02' },
  { id: 'tsk_02', projectId: 'prj_01', parentTaskId: 'tsk_01', title: 'Validasi input login', description: 'Validasi email dan password dengan Zod.', status: 'COMPLETED', priority: 'P2', deadline: '2026-11-02', divisionId: 'div_it', assigneeId: 'usr_03' },
  { id: 'tsk_03', projectId: 'prj_01', parentTaskId: null, title: 'Desain halaman absensi', description: 'Mockup halaman scan QR dan rekap kehadiran.', status: 'REVIEW', priority: 'P1', deadline: '2026-11-08', divisionId: 'div_it', assigneeId: 'usr_02' },
  { id: 'tsk_04', projectId: 'prj_01', parentTaskId: null, title: 'Integrasi QR scanner', description: 'Integrasi library pemindai QR di halaman absensi.', status: 'ASSIGNED', priority: 'P2', deadline: '2026-11-12', divisionId: 'div_it', assigneeId: null },
  { id: 'tsk_05', projectId: 'prj_02', parentTaskId: null, title: 'Migrasi database nilai', description: 'Migrasi tabel nilai lama ke skema baru.', status: 'BLOCKED', priority: 'P1', deadline: '2026-11-03', divisionId: 'div_it', assigneeId: 'usr_03' },
  { id: 'tsk_06', projectId: 'prj_02', parentTaskId: null, title: 'Halaman KRS online', description: 'CRUD KRS untuk mahasiswa.', status: 'IN_PROGRESS', priority: 'P2', deadline: '2026-11-18', divisionId: 'div_it', assigneeId: 'usr_02' },
  { id: 'tsk_07', projectId: 'prj_02', parentTaskId: null, title: 'Kampanye sosial media', description: 'Materi promosi portal akademik v2.', status: 'ASSIGNED', priority: 'P3', deadline: '2026-11-20', divisionId: 'div_mkt', assigneeId: 'usr_04' },
  { id: 'tsk_08', projectId: 'prj_03', parentTaskId: null, title: 'Riset framework mobile', description: 'Bandingkan React Native vs Flutter untuk aplikasi kampus.', status: 'COMPLETED', priority: 'P2', deadline: '2026-10-28', divisionId: 'div_it', assigneeId: 'usr_02' },
  { id: 'tsk_09', projectId: 'prj_03', parentTaskId: null, title: 'Wireframe aplikasi', description: 'Wireframe 10 layar utama aplikasi mobile.', status: 'BACKLOG', priority: 'P3', deadline: '2026-11-25', divisionId: 'div_it', assigneeId: null },
  { id: 'tsk_10', projectId: 'prj_01', parentTaskId: null, title: 'Laporan kehadiran bulanan', description: 'Export PDF rekap kehadiran per bulan.', status: 'ASSIGNED', priority: 'P2', deadline: '2026-11-15', divisionId: 'div_ops', assigneeId: 'usr_05' },
  { id: 'tsk_11', projectId: 'prj_02', parentTaskId: null, title: 'Uji beban portal', description: 'Load test 1000 pengguna bersamaan.', status: 'BACKLOG', priority: 'P2', deadline: '2026-12-01', divisionId: 'div_it', assigneeId: null },
  { id: 'tsk_12', projectId: 'prj_01', parentTaskId: null, title: 'Dokumentasi API', description: 'Tulis dokumentasi endpoint auth dan absensi.', status: 'COMPLETED', priority: 'P3', deadline: '2026-10-30', divisionId: 'div_it', assigneeId: 'usr_03' },
];

export const history: HistoryItem[] = [
  { id: 'hst_01', taskId: 'tsk_01', userId: 'usr_06', action: 'CREATED', oldStatus: null, newStatus: 'ASSIGNED', description: 'Task dibuat oleh Manager', createdAt: '2026-10-28 09:00' },
  { id: 'hst_02', taskId: 'tsk_01', userId: 'usr_01', action: 'DELEGATED', oldStatus: null, newStatus: null, description: 'Didelegasikan ke Andi Pratama', createdAt: '2026-10-28 10:15' },
  { id: 'hst_03', taskId: 'tsk_01', userId: 'usr_02', action: 'STATUS_CHANGED', oldStatus: 'ASSIGNED', newStatus: 'IN_PROGRESS', description: null, createdAt: '2026-10-29 08:30' },
  { id: 'hst_04', taskId: 'tsk_03', userId: 'usr_02', action: 'STATUS_CHANGED', oldStatus: 'IN_PROGRESS', newStatus: 'REVIEW', description: 'Siap direview ketua divisi', createdAt: '2026-11-01 14:20' },
  { id: 'hst_05', taskId: 'tsk_05', userId: 'usr_03', action: 'STATUS_CHANGED', oldStatus: 'IN_PROGRESS', newStatus: 'BLOCKED', description: 'Menunggu akses database lama', createdAt: '2026-11-01 09:45' },
];

export const attachments: Attachment[] = [
  { id: 'att_01', taskId: 'tsk_01', fileName: 'api-login-spec.pdf', fileType: 'application/pdf', fileSize: 245760, uploadedBy: 'usr_02' },
  { id: 'att_02', taskId: 'tsk_03', fileName: 'mockup-absensi.png', fileType: 'image/png', fileSize: 512000, uploadedBy: 'usr_02' },
  { id: 'att_03', taskId: 'tsk_01', fileName: 'postman-collection.json', fileType: 'application/json', fileSize: 18432, uploadedBy: 'usr_03' },
];

export const weeklyDone = [
  { week: 'W1', label: '1–7 Nov', count: 3 },
  { week: 'W2', label: '8–14 Nov', count: 8 },
  { week: 'W3', label: '15–21 Nov', count: 5 },
  { week: 'W4', label: '22–28 Nov', count: 2 },
];
