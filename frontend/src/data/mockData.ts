import type { NavItem } from '../types'

export const navItems: NavItem[] = [
  { id: 'dashboard', icon: '◉', label: 'Dasbor Eksekutif' },
  { id: 'tasks', icon: '▣', label: 'Manajemen Proyek & Tugas' },
  { id: 'structure', icon: '⌘', label: 'Struktur & Delegasi' },
  { id: 'rbac', icon: '♢', label: 'Manajemen RBAC & Akses' },
  { id: 'storage', icon: '♧', label: 'Penyimpanan Cloud' },
]

export const divisionData = [
  { name: 'Divisi Rekayasa & IT', tasks: '384 Tugas', value: 92, color: 'blue' },
  { name: 'Divisi Produk & Desain Solusi', tasks: '290 Tugas', value: 84, color: 'teal' },
  { name: 'Divisi Operasional & Keuangan', tasks: '356 Tugas', value: 76, color: 'gold' },
  { name: 'Divisi Compliance & Governance', tasks: '214 Tugas', value: 68, color: 'purple' },
]

export const lifecycleData = [
  { label: 'Inisiasi', value: '18%', number: '18%' },
  { label: 'Pengembangan', value: '42%', number: '42%' },
  { label: 'Review & QA', value: '26%', number: '26%' },
  { label: 'Penyelesaian', value: '14%', number: '14%' },
]

export const criticalItems = [
  {
    badge: 'MENDESAK',
    badgeClass: 'danger-pill',
    code: 'SEC-904',
    meta: '⏱ Tenggat Hari Ini',
    title: 'Remediasi Vulnerabilitas Gateway ISO 27001',
    owner: 'Dimas Saputra',
    status: 'Tertunda Manajerial',
  },
  {
    badge: 'TINGGI',
    badgeClass: 'gold-pill',
    code: 'OPS-112',
    meta: '◷ Sisa 1 Hari',
    title: 'Penyelarasan SLA Rekanan Cloud Provider Q3',
    owner: 'Ratih Nirmala',
    status: 'Sedang Ditinjau',
  },
  {
    badge: 'TINGGI',
    badgeClass: 'gold-pill',
    code: 'FIN-440',
    meta: '◷ Sisa 2 Hari',
    title: 'Persetujuan Pencairan Capex Infrastruktur Data Center',
    owner: 'Bambang W.',
    status: 'Tanda Tangan Eksekutif',
  },
]

export const activityItems = [
  { icon: '⌘', title: 'Bpk. Hendra (Direktur)', detail: 'mendelegasikan inisiatif strategis', project: 'Audit ISO 27001', time: '14 menit yang lalu', scope: 'Level 1 Direksi' },
  { icon: '↗', title: 'Siti Rahma (Ketua Divisi Desain)', detail: 'membagi sub-task', project: 'Design System v2', time: '48 menit yang lalu', scope: 'Level 2 Divisi' },
  { icon: '◉', title: 'Fahmi Reza (Lead QA)', detail: 'menyetujui hasil verifikasi akhir modul', project: 'Single Sign-On RBAC', time: '2 jam yang lalu', scope: 'Penyelesaian Mandat' },
]

export const taskRows = [
  { id: '#TSK-842', title: 'Implementasi Enkripsi Database Medis & JWT', subtitle: '▣ Proyek Rekam Medis Terpadu · Sub-tugas (4/5 Selesai)', division: 'IT & Security' },
  { id: '#TSK-843', title: 'Migrasi CDN Supabase Storage Assets Multi-Regional', subtitle: '☁ Infrastruktur Cloud Tier 4 · Sub-tugas (1/4 Selesai)', division: 'DevOps' },
  { id: '#TSK-844', title: 'Integrasi Protokol FHIR / HL7 untuk Rekam Medis Nasional', subtitle: '⇄ Interoperabilitas Kemenkes · Semua Sub-tugas Selesai', division: 'Produk' },
  { id: '#TSK-845', title: 'Audit Kelayakan Keamanan ISO 27001 Tahap II', subtitle: '⌾ Kepatuhan Regulasi & Siber · Sub-tugas (0/3)', division: 'Governance' },
]

export const managerList = [
  {
    label: 'TIER 2 · DIVISI TEKNIS',
    name: 'Raihan Anugrah',
    subtitle: 'Ketua Divisi Rekayasa Lunak',
    strength: '14 Pelaksana',
    activeTasks: '38 Mandat',
    load: '74% (Optimal)',
    loadValue: 74,
    members: [
      { name: 'Andi Firmansyah', description: 'Backend Core · 70% Normal' },
      { name: 'Siti Amelia', description: 'DevOps & Cloud · 110% Overload' },
    ],
  },
  {
    label: 'TIER 2 · DIVISI KREATIF',
    name: 'Andra Putranta',
    subtitle: 'Ketua Divisi Desain & Produk',
    strength: '8 Pelaksana',
    activeTasks: '19 Mandat',
    load: '85% (Optimal)',
    loadValue: 85,
    members: [
      { name: 'Bayu Wicaksono', description: 'UI/UX Systems · 85% Optimal' },
      { name: 'Larasti Putri', description: 'Design Researcher · 65% Normal' },
    ],
  },
  {
    label: 'TIER 2 · OPERASI BISNIS',
    name: 'Risfalda Hanum',
    subtitle: 'Ketua Pemasaran & O',
    strength: '11 Pelaksana',
    activeTasks: '24 Mandat',
    load: '72% (Optimal)',
    loadValue: 72,
    members: [
      { name: 'Gita Novita', description: 'Field Ops Strategist · 72%' },
      { name: 'Hendra', description: 'Campaign Ops · 80%' },
    ],
  },
]

export const auditRows = [
  ['15 Jun 2025, 09:30 WIB', 'DEL-2025-0891', 'BS Wimbuh Agus Alim', 'RP Raihan Anugrah', 'Mandat Migrasi Datacenter Jakarta Tier-4', 'Tingkat 1'],
  ['15 Jun 2025, 08:14 WIB', 'DEL-2025-0890', 'RP Raihan Anugrah', 'SA Siti Amelia', 'Implementasi Kubernetes Failover Cluster', 'Tingkat 2'],
  ['14 Jun 2025, 16:45 WIB', 'DEL-2025-0887', 'BS Wimbuh Agus Alim', 'DK Dina Kusuma', 'Audit Komprehensif Aksesibilitas WCAG 2.1 AA', 'Tingkat 1'],
]

export const roleCards = [
  { level: 'TINGKAT 1 — ROOT', title: 'Administrator', count: '3', subtitle: 'Akun Aktif', text: 'Akses penuh kontrol sistem, rotasi kunci kriptografi JWT, audit global, dan regulasi RBAC terpusat.', accent: '' },
  { level: 'TINGKAT 2 — MANAJERIAL', title: 'Manager / Eksekutif', count: '8', subtitle: 'Akun Aktif', text: 'Delegasi lintas divisi, pemantauan dasbor eksekutif, serta approval anggaran dan proyek strategis.', accent: '' },
  { level: 'TINGKAT 3 — SUPERVISI', title: 'Ketua Divisi', count: '16', subtitle: 'Akun Aktif', text: 'Kelola anggota internal divisi, alokasi tugas berjenjang, peninjauan progres, dan validasi output kerja.', accent: 'teal-card' },
  { level: 'TINGKAT 4 — OPERASIONAL', title: 'Anggota (Staff)', count: '115', subtitle: 'Akun Aktif', text: 'Eksekusi tugas operasional, unggah arsip kerja cloud storage, pembaruan status checklist berkala.', accent: 'gray-card' },
]

export const permissionMatrix = [
  ['🏛 Manajemen Organisasi & Direktorat', '✓', '✓', '−', '−'],
  ['⚯ Delegasi Tugas Berjenjang', '✓', '✓', '✓', '−'],
  ['▣ CRUD Project & Milestone', '✓', '✓', '✓', 'ⓘ'],
  ['☁ Upload Lampiran Cloud Storage', '✓', '✓', '✓', '✓'],
  ['♙ Penghapusan Data Permanen (Hard Delete)', '✓', '−', '−', '−'],
  ['♢ Pengaturan Kebijakan RBAC & JWT', '✓', '−', '−', '−'],
]

export const directoryRows = [
  { initials: 'AD', name: 'Arya Daniswara', email: 'arya.daniswara@sovereign.id', division: 'Direksi & Eksekutif', role: 'Administrator', roleClass: 'role-pill', tokenStatus: 'Hari ini, 09:41 WIB', validity: '✓ Token Valid (exp 10:41)', statusClass: 'green-pill', twoFa: 'AKTIF', accent: '' },
  { initials: 'BW', name: 'Bima Wicaksono', email: 'bima.w@sovereign.id', division: 'Teknologi & Produk', role: 'Manager', roleClass: 'role-pill', tokenStatus: 'Hari ini, 08:15 WIB', validity: '✓ Token Valid (exp 14:15)', statusClass: 'green-pill', twoFa: 'AKTIF', accent: 'pale' },
  { initials: 'DR', name: 'Dewi Rahmawati', email: 'dewi.r@sovereign.id', division: 'Operasional & SDM', role: 'Ketua Divisi', roleClass: 'role-pill teal-pill', tokenStatus: 'Kemarin, 17:30 WIB', validity: 'Token Sesi Berakhir', statusClass: '', twoFa: 'AKTIF', accent: 'teal' },
  { initials: 'RA', name: 'Rian Anggoro', email: 'rian.a@sovereign.id', division: 'Teknologi & Produk', role: 'Anggota', roleClass: 'role-pill gray-pill', tokenStatus: 'Hari ini, 09:02 WIB', validity: '✓ Token Valid (exp 10:02)', statusClass: 'green-pill', twoFa: 'NON-AKTIF', accent: 'pale' },
  { initials: 'FS', name: 'Fajar Santoso', email: 'fajar.s@sovereign.id', division: 'Pemasaran & Hubungan', role: 'Anggota', roleClass: 'role-pill gray-pill', tokenStatus: '3 hari lalu', validity: '⊘ Akun Ditangguhkan', statusClass: 'red', twoFa: 'NON-AKTIF', accent: 'coral' },
]
