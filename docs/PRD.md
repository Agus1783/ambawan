# PRD — AmbaDo

**Product Requirements Document**

| | |
| --- | --- |
| Produk | AmbaDo — Platform Manajemen Proyek & Tugas |
| Versi dokumen | 1.1 — Draft (diperbarui 13 Nov 2026: tambah role kustom) |
| Tanggal | 12 November 2026 (diperbarui 13 November 2026) |
| Pemilik produk | Agus (QA, DevOps & Integration) |
| Tim | Raihan (Backend & Database), Andra (Frontend & UI/UX) |
| Status | Draft — 6 pertanyaan §13 sudah diputuskan (13 Nov 2026); siap revisi dokumentasi |
| Dokumen acuan | `README.md`, `docs/api_spesification.md`, `docs/database_schema.sql` (master, per 12 Nov 2026) |
| Referensi produk | monday.com (model workspace multi-tenant) |

---

## 1. Ringkasan

AmbaDo adalah platform web manajemen proyek dan tugas. Visi produk ini: **aplikasi global ala monday.com** — siapa pun di perusahaan atau organisasi mana pun dapat mendaftar, membuat workspace-nya sendiri, dan mengelola proyek beserta timnya. Dokumentasi saat ini merancang AmbaDo sebagai aplikasi **satu instansi** (single-tenant): satu organisasi, satu daftar divisi global, dan satu role global per pengguna. PRD ini mendefinisikan perubahan yang diperlukan agar AmbaDo menjadi multi-tenant dengan workspace sebagai batas kepemilikan data.

Satu kalimat visi: *satu akun, satu workspace milik sendiri; boleh bergabung ke workspace lain hanya lewat undangan.*

---

## 2. Masalah

1. **Tidak ada konsep workspace/organisasi.** Skema database tidak memiliki tabel organisasi atau workspace. Divisi memakai `name UNIQUE` secara global, pengguna hanya punya satu `role_id` dan satu `division_id` global, dan proyek tidak punya pemilik (`created_by` / `owner_id` tidak ada). Dua perusahaan berbeda tidak dapat memakai AmbaDo secara terpisah — datanya tercampur.
2. **Pembuat proyek tidak menjadi pemilik.** Spesifikasi §10.2: hanya `MANAGER` yang boleh membuat proyek, dan `ADMIN` justru tidak boleh. Pengguna baru mendaftar sebagai `MEMBER` (§6.1), sehingga tidak bisa membuat proyek sama sekali.
3. **Tidak ada login Google.** Spesifikasi hanya mengenal email + password; kolom `password` di tabel `users` bersifat `NOT NULL`, sehingga akun yang hanya memakai Google tidak dapat direpresentasikan.
4. **Tidak ada onboarding bidang usaha, saran proyek, dan template tugas.** Kata `template`, `saran`, `industri`, `invite`, dan `workspace` tidak muncul satu kali pun di `api_spesification.md`.
5. **Tidak ada undangan.** Anggota hanya bisa ditambahkan oleh `ADMIN` secara global (§7.3, §9.7). Tidak ada alur undang-terima, tidak ada keanggotaan per proyek.

Yang **sudah sesuai** dan dipertahankan: subtugas (`parent_task_id`, §12 dan §18), status tugas (BACKLOG, ASSIGNED, IN_PROGRESS, REVIEW, COMPLETED, BLOCKED, CANCELLED), delegasi berjenjang, riwayat tugas, lampiran tugas, dashboard analitik, serta pencarian/filter/paginasi.

---

## 3. Tujuan dan Non-Tujuan

### 3.1 Tujuan (MVP baru)

1. Pengguna mana pun dapat mendaftar (email + password atau Google) dan langsung membuat workspace serta proyeknya sendiri.
2. Pembuat proyek otomatis menjadi Owner proyek tersebut.
3. Setiap workspace memiliki bidang usaha, dan AmbaDo memberi saran proyek + template tugas berdasarkan bidang tersebut.
4. Owner dapat mengundang Manager / Ketua Divisi ke proyek; Ketua Divisi dapat mengundang Anggota.
5. Satu akun hanya boleh memiliki satu workspace yang dibuat sendiri, tetapi boleh menjadi anggota banyak workspace lain melalui undangan.
6. Semua data (divisi, proyek, tugas) terisolasi per workspace.

### 3.2 Non-Tujuan (di luar MVP ini)

- Penagihan / paket berbayar.
- Integrasi kalender, chat, atau alat pihak ketiga lain.
- Aplikasi mobile native.
- Otomasi alur kerja (workflow automation) dan AI di luar saran proyek/template tugas.
- Mode offline.

---

## 4. Pengguna dan Persona

| Persona | Gambaran |
| --- | --- |
| **Pengunjung** | Belum punya akun; melihat landing page, lalu mendaftar. |
| **Owner** | Membuat workspace dan/atau proyek; mengundang Manager dan Ketua Divisi; mengelola workspace-nya. Satu akun hanya boleh menjadi Owner dari **satu** workspace yang dibuatnya sendiri. |
| **Manager** | Diundang Owner ke sebuah proyek; membuat proyek/tugas, mendelegasikan ke divisi atau anggota, memantau progres. |
| **Ketua Divisi** | Diundang ke proyek; memecah tugas menjadi subtugas, mendelegasikan ke anggota divisinya, mengundang anggota baru ke divisinya dalam proyek tersebut. |
| **Anggota (Member)** | Diundang ke proyek; mengerjakan tugas yang diberikan, mengubah status, mengunggah lampiran, berkomentar. |

Catatan penting: **role tidak lagi global.** Pengguna yang sama dapat menjadi Owner di workspace A dan Member di workspace B. Role disimpan pada keanggotaan (membership), bukan pada pengguna.

---

## 5. Alur Produk (User Journey)

1. **Buka web AmbaDo** → landing page → Register / Login.
2. **Register** dengan nama, email, password — atau **langsung dengan akun Google** (OAuth 2.0). Login memakai cara yang sama.
3. **Buat workspace** (untuk pengguna baru): isi nama perusahaan/organisasi, lalu **pilih bidang usaha** (contoh: Software House, Pendidikan, Kesehatan, Retail, Manufaktur, Jasa, Lainnya).
4. **Buat proyek baru.** AmbaDo menampilkan **saran proyek sesuai bidang** — contoh: bidang Software House → "Aplikasi Absensi Siswa", "Sistem Informasi Akademik", "Aplikasi Kasir". Pengguna boleh memakai saran atau menulis nama proyek sendiri.
5. **Template tugas (opsional).** Setelah proyek dibuat, AmbaDo menawarkan **template tugas** sesuai proyek yang dipilih (contoh untuk Aplikasi Absensi Siswa: analisis kebutuhan, desain UI, endpoint login, modul absensi, pengujian). Pengguna memilih memakai template atau tidak; tugas dari template dapat diedit atau dihapus setelah dibuat.
6. **Daftar tugas.** Setiap tugas dapat memiliki **subtugas**; setiap tugas dan subtugas memiliki status: To Do (Backlog), Assigned, In Progress, In Review, Completed, Blocked, Cancelled — plus prioritas (P1–P3) dan deadline.
7. **Owner mengundang Manager / Ketua Divisi** ke proyek (lewat email). Undangan berlaku sampai diterima atau kedaluwarsa; penerima yang belum punya akun diminta mendaftar dulu, lalu otomatis bergabung ke proyek.
8. **Ketua Divisi mengundang Anggota** ke divisinya dalam proyek tersebut, lalu memecah tugas menjadi subtugas dan mendelegasikannya.
9. **Anggota mengerjakan tugas**: mengubah status, mengunggah lampiran, berkomentar; progres terpantau di dashboard per proyek dan per workspace.

---

## 6. Persyaratan Fungsional

Keterangan status: **Ada** = sudah ada di dokumentasi saat ini; **Ubah** = ada tetapi harus diubah; **Baru** = belum ada.

| ID | Persyaratan | Prioritas | Status |
| --- | --- | --- | --- |
| FR-01 | Register dengan nama, email, password; role awal bukan lagi MEMBER global, melainkan calon Owner workspace baru | Must | Ubah |
| FR-02 | Register dan login dengan akun Google (OAuth 2.0); akun Google tanpa password tetap valid | Must | Baru |
| FR-03 | Satu akun hanya boleh membuat **satu** workspace sendiri; percobaan kedua ditolak dengan pesan yang jelas | Must | Baru |
| FR-04 | Pembuatan workspace: nama perusahaan/organisasi + pilihan bidang usaha (bidang dari sistem; Owner boleh menambah bidang sendiri) | Must | Baru |
| FR-05 | Pembuat workspace otomatis menjadi Owner workspace tersebut | Must | Baru |
| FR-06 | Saran proyek berdasarkan bidang usaha saat membuat proyek; pengguna boleh mengabaikan saran | Must | Baru |
| FR-07 | Template tugas per jenis proyek; pengguna memilih memakai atau tidak saat proyek dibuat; tugas hasil template dapat diedit/dihapus | Must | Baru |
| FR-08 | Pembuat proyek otomatis menjadi Owner proyek tersebut | Must | Baru |
| FR-09 | Proyek dapat dibuat oleh Owner workspace atau pengguna yang diundang sebagai Manager (bukan hanya role global MANAGER) | Must | Ubah |
| FR-10 | Tugas dan subtugas (1 tingkat atau lebih) dengan status To Do / Assigned / In Progress / In Review / Completed / Blocked / Cancelled, prioritas, dan deadline | Must | Ada |
| FR-11 | Owner dapat mengundang pengguna lain sebagai Manager atau Ketua Divisi ke proyek lewat email | Must | Baru |
| FR-12 | Ketua Divisi dapat mengundang pengguna lain sebagai Anggota ke divisinya dalam proyek | Must | Baru |
| FR-13 | Undangan: token undangan, berlaku 7 hari, dapat dikirim ulang, status (pending / diterima / kedaluwarsa / ditolak); penerima tanpa akun diarahkan mendaftar lalu otomatis bergabung | Must | Baru |
| FR-14 | Pengguna dapat menjadi anggota banyak workspace melalui undangan; daftar workspace yang diikutinya tampil di pengalih workspace (workspace switcher) | Must | Baru |
| FR-15 | Semua data (divisi, proyek, tugas, lampiran, riwayat) terisolasi per workspace; pengguna tidak dapat melihat data workspace lain yang bukan anggotanya | Must | Baru |
| FR-16 | Nama divisi unik **per workspace** (bukan global); struktur divisi dikelola per workspace | Must | Ubah |
| FR-17 | Delegasi tugas berjenjang: Owner/Manager → divisi atau anggota; Ketua Divisi → anggota; dengan riwayat delegasi | Must | Ada |
| FR-18 | Komentar pada tugas | Should | Baru |
| FR-19 | Dashboard analitik per proyek dan per workspace (total tugas, selesai, terlambat, progres per divisi/anggota) | Must | Ada |
| FR-20 | Pencarian, filter (status, prioritas, divisi, anggota, deadline), dan paginasi — dengan cakupan workspace aktif | Must | Ada |
| FR-21 | Lampiran tugas (upload, lihat, hapus) dengan cloud storage | Must | Ada |
| FR-22 | Riwayat aktivitas tugas (perubahan status, delegasi) | Must | Ada |
| FR-23 | Pengaturan peran: Owner dapat mengubah role anggota di workspace/proyeknya dan menghapus anggota | Must | Ubah |
| FR-24 | Pengguna yang keluar/dihapus dari workspace kehilangan akses ke data workspace tersebut | Must | Baru |
| FR-25 | Owner workspace dapat membuat, mengedit, dan menghapus **role kustom** beserta izinnya (izin dipilih dari katalog izin sistem); role bawaan sistem (Owner, Manager, Ketua Divisi, Anggota) tidak dapat diubah atau dihapus | Must | Baru |

---

## 7. Peran dan Izin (Model Baru)

Peran melekat pada **keanggotaan** (workspace atau proyek), bukan pada pengguna secara global. Peran disimpan sebagai baris di `workspace_roles`: 4 role bawaan sistem (Owner, Manager, Ketua Divisi, Anggota) yang berlaku untuk semua workspace, ditambah role kustom yang dibuat Owner per workspace. Izin tiap role disimpan di `role_permissions` dan dipilih dari katalog izin sistem (24 izin, lihat §8.1). Mengubah role anggota (mis. Member diangkat menjadi Ketua Divisi) adalah perubahan data biasa; membuat jenis role baru tidak butuh perubahan skema — cukup menambah baris role + izinnya. Peran `ADMIN` global dihapus; pengelolaan sistem (bila diperlukan) menjadi peran internal terpisah di luar produk.

| Aksi | Owner (workspace/proyek) | Manager (proyek) | Ketua Divisi | Anggota |
| --- | --- | --- | --- | --- |
| Membuat workspace | ✅ (maks. 1) | ❌ | ❌ | ❌ |
| Mengundang Manager / Ketua Divisi ke proyek | ✅ | ❌ | ❌ | ❌ |
| Mengundang Anggota ke divisi dalam proyek | ✅ | ❌ | ✅ | ❌ |
| Membuat proyek | ✅ | ✅ | ❌ | ❌ |
| Mengubah / menghapus proyek | ✅ | ✅* | ❌ | ❌ |
| Membuat tugas | ✅ | ✅ | ✅ | ❌ |
| Membuat subtugas | ✅ | ✅ | ✅ | ❌ |
| Mendelegasikan tugas | ✅ | ✅ | ✅* | ❌ |
| Mengubah status tugas sendiri | ✅ | ✅ | ✅ | ✅ |
| Mengelola divisi di workspace | ✅ | ❌ | ❌ | ❌ |
| Melihat dashboard workspace/proyek | ✅ | ✅ | ✅ | ✅ (proyeknya) |

`*` hanya dalam kewenangan proyek/divisi yang bersangkutan.

Pembuat proyek — baik Owner workspace maupun Manager yang diundang — menjadi Owner proyek tersebut.

**Aturan penegakan:** backend tidak boleh hanya mengandalkan role; setiap akses harus memeriksa keanggotaan workspace/proyek yang bersangkutan (meneruskan aturan §26 spesifikasi lama).

---

## 8. Model Data

### 8.1 Tabel baru

| Tabel | Kolom kunci | Keterangan |
| --- | --- | --- |
| `workspaces` | `id`, `name`, `industry`, `owner_id` → users, `created_at`, `updated_at` | Satu workspace = satu perusahaan/organisasi. `owner_id` unik: satu pengguna hanya boleh memiliki satu workspace. Nama workspace boleh sama antar pengguna (tidak unik global). |
| `workspace_memberships` | `workspace_id`, `user_id`, `role_id` (→ workspace_roles), `created_at` | Keanggotaan + role per workspace. `role_id` merujuk ke role bawaan sistem atau role kustom milik workspace tersebut. Satu pengguna boleh menjadi anggota banyak workspace. |
| `invitations` | `id`, `workspace_id`, `project_id` (nullable), `email`, `role_id` (→ workspace_roles), `token`, `status` (PENDING / ACCEPTED / EXPIRED / DECLINED), `invited_by` → users, `expires_at` | Undangan lewat email. Berlaku 7 hari, dapat dikirim ulang (token baru). Role OWNER tidak dapat diundang. |
| `industries` | `id`, `name`, `description` | Daftar bidang usaha (data referensi dari sistem; Owner workspace boleh menambah bidang sendiri). |
| `project_templates` | `id`, `industry_id`, `name`, `description` | Saran proyek per bidang usaha. Owner workspace boleh membuat/mengedit template proyek sendiri. |
| `task_templates` | `id`, `project_template_id`, `title`, `description`, `priority`, `sort_order`, `parent_template_id` (nullable, untuk subtugas template) | Template tugas per jenis proyek. Owner workspace boleh membuat/mengedit template tugas sendiri. |
| `workspace_roles` | `id`, `workspace_id` (NULL = role bawaan sistem), `name`, `description`, `is_system`, `created_by` | Role per workspace. Role bawaan sistem (Owner, Manager, Ketua Divisi, Anggota) tidak dapat diubah/dihapus; role kustom milik satu workspace dan dibuat/diedit/dihapus Owner-nya. Nama role unik per workspace. |
| `role_permissions` | `id`, `role_id` (→ workspace_roles), `permission` | Izin yang dimiliki satu role, dipilih dari katalog izin sistem (24 izin: `workspace.view/update/delete`, `workspace.manage_divisions/templates/industries`, `member.invite/manage`, `project.create/update/delete/view`, `task.create/update/delete/delegate/update_status/view`, `attachment.upload/delete`, `comment.create`, `dashboard/analytics/history.view`). Satu baris = satu izin. |

### 8.2 Perubahan tabel yang sudah ada

| Tabel | Perubahan |
| --- | --- |
| `users` | `password` menjadi nullable (akun Google); tambah `google_id` (nullable, unique) dan `auth_provider` (`EMAIL` / `GOOGLE`); **hapus** `role_id` dan `division_id` (pindah ke membership); tambah `onboarding_completed` (boolean). |
| `roles` | Dihapus sebagai tabel global; digantikan `workspace_roles` (role per workspace: 4 role bawaan sistem + role kustom) dengan izin di `role_permissions` — lihat §8.1. |
| `divisions` | Tambah `workspace_id` → workspaces; `name` unik **per workspace** (unique constraint gabungan `workspace_id, name`), bukan global. |
| `projects` | Tambah `workspace_id` → workspaces, `owner_id` → users (pembuat = Owner), `industry_id` (nullable), `project_template_id` (nullable, bila dibuat dari template). |
| `tasks` | Tambah `workspace_id` (denormalisasi untuk isolasi dan query); tidak ada perubahan pada `parent_task_id` dan status. |
| `task_history`, `task_attachments` | Tidak berubah (mengikuti `task_id`). |

### 8.3 Aturan data

- `workspaces.owner_id` harus unik (constraint): satu pengguna = satu workspace milik sendiri.
- Role bawaan sistem (Owner, Manager, Ketua Divisi, Anggota) tidak dapat diubah atau dihapus; role kustom hanya berlaku di workspace yang membuatnya.
- Role yang masih dipakai oleh membership atau undangan pending tidak dapat dihapus.
- Tepat satu OWNER per workspace ditegakkan aplikasi (pembuat workspace mendapat role OWNER sistem; perubahan role yang akan menciptakan OWNER kedua ditolak).
- Semua query divisi/proyek/tugas **wajib** memfilter `workspace_id` dari workspace aktif pengguna.
- Undangan yang diterima oleh email yang belum terdaftar: setelah register, keanggotaan dibuat otomatis.
- Menghapus workspace menghapus seluruh data di dalamnya (CASCADE); mengeluarkan anggota hanya menghapus membership-nya.

---

## 9. API (Baru dan Diubah)

### 9.1 Endpoint baru

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| POST | `/auth/google` | Login/register dengan Google (menerima token Google, mengembalikan JWT AmbaDo). |
| POST | `/workspaces` | Membuat workspace (maks. 1 per pengguna); body: nama + `industry_id`. |
| GET | `/workspaces` | Daftar workspace yang diikuti pengguna (milik sendiri + undangan). |
| GET | `/workspaces/:id` | Detail workspace. |
| PUT | `/workspaces/:id` | Ubah workspace (Owner). |
| DELETE | `/workspaces/:id` | Hapus workspace (Owner). |
| GET | `/industries` | Daftar bidang usaha. |
| GET | `/industries/:id/project-suggestions` | Saran proyek untuk satu bidang usaha. |
| GET | `/projects/templates/:templateId/tasks` | Template tugas untuk satu jenis proyek (pratinjau sebelum memakai). |
| POST | `/workspaces/:id/invitations` | Undang pengguna lewat email (Owner; body: email + role + `project_id` opsional). |
| GET | `/workspaces/:id/invitations` | Daftar undangan workspace. |
| POST | `/invitations/:token/accept` | Terima undangan (pengguna login; bila belum punya akun, diarahkan register). |
| POST | `/invitations/:token/decline` | Tolak undangan. |
| POST | `/invitations/:id/resend` | Kirim ulang undangan (Owner; membuat token baru, berlaku 7 hari). |
| GET | `/workspaces/:id/members` | Anggota workspace beserta role-nya. |
| PUT | `/workspaces/:id/members/:userId/role` | Ubah role anggota (Owner). |
| DELETE | `/workspaces/:id/members/:userId` | Keluarkan anggota (Owner). |
| GET | `/workspaces/:id/roles` | Daftar role workspace (bawaan sistem + kustom) beserta izinnya. |
| POST | `/workspaces/:id/roles` | Buat role kustom (Owner; body: nama + daftar permission dari katalog). |
| GET | `/workspaces/:id/roles/:roleId` | Detail satu role + izinnya. |
| PUT | `/workspaces/:id/roles/:roleId` | Ubah role kustom (nama/izin); role bawaan sistem tidak dapat diubah. |
| DELETE | `/workspaces/:id/roles/:roleId` | Hapus role kustom (ditolak bila masih dipakai anggota/undangan). |
| GET | `/permissions` | Katalog izin sistem. |
| GET | `/projects/:id/members` | Anggota proyek beserta role-nya. |
| POST | `/tasks/:id/comments` | Tambah komentar pada tugas. |
| GET | `/tasks/:id/comments` | Daftar komentar tugas. |

### 9.2 Endpoint yang berubah

| Endpoint | Perubahan |
| --- | --- |
| `POST /auth/register` | Response dan token sama; role awal tidak lagi MEMBER global — pengguna diarahkan membuat workspace (onboarding). |
| `POST /projects` | Boleh dibuat Owner workspace / Manager proyek; body boleh menyertakan `project_template_id` dan `apply_task_template: true/false`; response menyertakan `owner_id` dan `workspace_id`. |
| `GET /projects`, `GET /tasks` | Cakupan dibatasi workspace aktif (`workspace_id` wajib, dari header/query atau workspace aktif pengguna). |
| `POST /users`, `PUT /users/:id`, `DELETE /users/:id` | Dihapus dari API produk (manajemen pengguna menjadi undangan + membership per workspace); pembuatan pengguna oleh ADMIN global tidak ada lagi. |
| `PUT /divisions/:id/leader` | Tetap ada, tetapi dalam cakupan workspace dan hanya oleh Owner workspace. |
| `POST /tasks` | Tetap mendukung subtugas (`parent_task_id`) seperti §12; cakupan workspace ditambahkan. |

### 9.3 Autentikasi

- JWT Bearer tetap dipakai untuk semua endpoint terproteksi.
- Google OAuth 2.0 (authorization code flow) di frontend; backend memverifikasi token Google, lalu membuat/mencocokkan pengguna berdasarkan `google_id` atau email, dan menerbitkan JWT AmbaDo seperti login biasa.
- Token undangan terpisah dari JWT dan memiliki masa berlaku 7 hari; dapat dikirim ulang (token baru, berlaku 7 hari lagi).

---

## 10. Persyaratan Non-Fungsional

| Aspek | Persyaratan |
| --- | --- |
| Keamanan | Isolasi data antar workspace ditegakkan di backend (bukan hanya di UI); setiap query sensitif memfilter `workspace_id`. Kata sandi tetap di-hash (bcrypt). |
| Performa | Daftar tugas memakai paginasi; query per workspace memakai indeks pada `workspace_id`. |
| Ketersediaan | Target mengikuti hosting saat ini (Vercel + Render + Supabase, free tier untuk tugas kuliah). |
| Skalabilitas | Desain mendukung banyak workspace; tidak ada asumsi satu organisasi di kode maupun skema. |
| Kegunaan | Onboarding (register → pilih bidang → buat proyek pertama) dapat diselesaikan dalam < 5 menit; template tugas bersifat opsional dan mudah dibatalkan. |
| Kompatibilitas | Frontend React + Vite + Tailwind yang sudah ada dipakai kembali; perubahan terutama pada alur auth/onboarding dan cakupan workspace. |

---

## 11. Rencana Migrasi dari Dokumentasi Saat Ini

Urutan yang disarankan (setiap tahap diverifikasi sebelum lanjut):

1. **Keputusan tim.** Setujui PRD ini; putuskan pertanyaan terbuka di §13.
2. **Revisi skema.** Tambah tabel §8.1; ubah tabel §8.2; buat migrasi Prisma baru. Data lama (satu organisasi) dimigrasikan menjadi satu workspace awal ("Workspace Default") agar data yang sudah ada tidak hilang.
3. **Revisi API spec.** Perbarui `docs/api_spesification.md` (§2 peran, §6 auth + Google, §9–§10 cakupan workspace, §baru: workspace/invitation/template) dan `README.md` (fitur MVP + peta alur).
4. **Backend.** Implementasi auth Google, workspace, undangan, template/saran, lalu ubah endpoint lama ke cakupan workspace (sesuai urutan §9).
5. **Frontend.** Alur onboarding baru (pilih bidang → saran proyek → template tugas), pengalih workspace, halaman undangan/anggota; halaman yang sudah ada (dashboard, proyek, tugas) diberi konteks workspace aktif.
6. **Pengujian.** Uji isolasi workspace (pengguna A tidak melihat data workspace B), aturan satu workspace milik sendiri, alur undangan (termasuk penerima tanpa akun), dan template tugas.
7. **Dokumentasi akhir.** Perbarui README + diagram arsitektur (`docs/architecture_diagram.jpg`) dan diagram skema (`docs/database_schema.png`).

---

## 12. Kriteria Penerimaan

1. Pengguna baru dapat mendaftar dengan email + password **dan** dengan Google, lalu membuat tepat satu workspace.
2. Pengguna yang mencoba membuat workspace kedua menerima penolakan yang jelas.
3. Setelah memilih bidang Software House, pengguna melihat saran proyek (mis. Aplikasi Absensi Siswa) dan dapat membuat proyek darinya.
4. Saat membuat proyek dari template, pengguna ditawari template tugas; memilih memakai menghasilkan tugas-tugas template (termasuk subtugas bila ada), memilih tidak menghasilkan proyek kosong.
5. Pembuat proyek tercatat sebagai Owner; Owner dapat mengundang Manager/Ketua Divisi lewat email; Ketua Divisi dapat mengundang Anggota.
6. Penerima undangan tanpa akun: setelah mendaftar, otomatis menjadi anggota proyek/workspace yang mengundangnya.
7. Pengguna yang hanya anggota workspace B tidak dapat membuka data workspace A (API mengembalikan 403/404).
8. Tugas mendukung subtugas dan seluruh status (To Do s.d. Cancelled) seperti sebelumnya.
9. Seluruh endpoint baru/berubah terdokumentasi di `api_spesification.md` dan lolos pengujian backend + CI.

---

## 13. Keputusan atas Pertanyaan Terbuka (diputuskan 13 Nov 2026)

Keenam pertanyaan di bawah ini sudah diputuskan dan menjadi bagian dari PRD ini:

1. **ADMIN global dihapus sepenuhnya.** Tidak ada lagi peran admin sistem global; pengelolaan pengguna dilakukan lewat undangan dan membership per workspace.
2. **Owner boleh menambah bidang usaha sendiri.** Daftar bidang usaha disediakan sistem (seed), tetapi Owner workspace boleh menambah bidang baru.
3. **Nama workspace boleh sama antar pengguna.** Nama workspace tidak harus unik global.
4. **Undangan berlaku 7 hari dan boleh dikirim ulang.** Pengiriman ulang membuat token baru yang berlaku 7 hari lagi.
5. **Boleh — baik Owner workspace maupun Manager yang diundang dapat membuat proyek.** Owner workspace mengundang seseorang sebagai Manager; Manager tersebut dapat membuat proyek di workspace itu. Pembuat proyek (Owner workspace atau Manager) menjadi Owner proyek tersebut.
6. **Owner boleh membuat atau mengedit template sendiri.** Template proyek dan template tugas tidak hanya bawaan sistem; Owner workspace boleh membuat/mengedit template sesuai keinginannya.
7. **Role kustom (diputuskan 13 Nov 2026).** Owner boleh membuat, mengedit, dan menghapus role kustom beserta izinnya (izin dipilih dari katalog izin sistem). Role bawaan sistem (Owner, Manager, Ketua Divisi, Anggota) tidak dapat diubah atau dihapus.

---

## Lampiran A — Pemetaan Visi ke Dokumentasi Saat Ini

| Keinginan | Status di dokumentasi | Bukti |
| --- | --- | --- |
| Aplikasi global (multi-tenant) | ❌ Tidak ada | Tidak ada tabel organisasi/workspace; `divisions.name` UNIQUE global; `users` satu role global |
| Register/login nama, email, password | ✅ Ada | Spec §6.1–§6.2 |
| Register/login dengan Google | ❌ Tidak ada | 0 kemunculan "google"/"OAuth" di spec; `users.password NOT NULL` |
| Pembuat proyek otomatis Owner | ❌ Bertentangan | Spec §10.2: hanya MANAGER boleh membuat proyek; `projects` tanpa `owner_id`/`created_by`; tidak ada role OWNER |
| Pilih bidang usaha setelah register | ❌ Tidak ada | 0 kemunculan "industri"/"bidang"; alur §25 langsung Login → Dashboard → Create Project |
| Saran proyek per bidang | ❌ Tidak ada | 0 kemunculan "saran"/"suggestion"; `POST /projects` hanya menerima nama/deskripsi/deadline |
| Template tugas opsional | ❌ Tidak ada | 0 kemunculan "template"; tidak ada tabel template |
| Subtugas + status (to-do, in-review, dst.) | ✅ Ada | `tasks.parent_task_id`; status BACKLOG/ASSIGNED/IN_PROGRESS/REVIEW/COMPLETED/BLOCKED/CANCELLED; spec §12, §18 |
| Owner undang Manager / Ketua Divisi | ⚠️ Sebagian | Hanya ADMIN global yang bisa membuat pengguna (§7.3) dan menentukan ketua divisi (§9.7); tidak ada undangan |
| Ketua Divisi undang Anggota | ⚠️ Sebagian | Ketua Divisi dapat mengelola anggota divisinya (§2.1), tetapi keanggotaan bersifat global, bukan per proyek, dan tanpa undangan |
| Satu workspace milik sendiri, boleh gabung workspace lain via undangan | ❌ Tidak ada | Tidak ada konsep workspace, membership, maupun undangan |
| Dashboard analitik | ✅ Ada | Spec §21 |
| Lampiran tugas | ✅ Ada | Spec §20; hanya level tugas (bukan proyek) |
| Komentar tugas | ❌ Tidak ada | 0 kemunculan "comment" di spec (fitur ini baru ada di mockup frontend) |

---
