# AMBADO - Project Mata Kuliah Software Development

## Nama Anggota
1. Wimbuh Agus Alim (QA, DevOps & Integration Specialist)
1. Raihan Anugrah Adrian Arji (Backend & Database Engineer).
1. Andra Putranta Hendiana (Frontend & UI/UX Specialist).

## Deskripsi Singkat Proyek
Ambado merupakan Platform Web Manajemen Project & Tugas **multi-tenant ala monday.com**: siapa pun dapat mendaftar, membuat workspace untuk perusahaan atau organisasinya, dan mengelola proyek beserta tim di dalamnya. Setiap workspace terisolasi dari workspace lain — satu akun hanya boleh memiliki satu workspace yang dibuatnya sendiri, tetapi boleh bergabung ke banyak workspace lain melalui undangan.

Pengguna mendaftar dengan email dan password atau langsung dengan akun Google, memilih bidang usaha workspace-nya (misalnya Software House), lalu membuat proyek dengan bantuan saran proyek dan template tugas sesuai bidang tersebut. Platform ini memungkinkan pemimpin mendelegasikan tugas secara hierarkis kepada setiap divisi dan anggota, sekaligus memantau progres dan produktivitas melalui dashboard analitik.

## Fitur Utama Sistem / MVP
* **Manajemen Workspace & Bidang Usaha:** Pembuatan workspace untuk perusahaan atau organisasi beserta pilihan bidang usahanya (misalnya Software House, Pendidikan, Kesehatan). Satu akun hanya boleh memiliki satu workspace; nama workspace boleh sama antar pengguna. Owner boleh menambah bidang usaha sendiri.

* **Otentikasi Aman & Otorisasi RBAC:** Register, login, dan logout menggunakan autentikasi berbasis JWT, termasuk **login dengan akun Google (OAuth 2.0)**. Hak akses mengikuti role pengguna **di dalam workspace atau proyek** — Owner, Manager, Ketua Divisi, dan Anggota — bukan role global. Owner workspace juga dapat membuat **role kustom** beserta izinnya. Peran ADMIN global tidak ada lagi.

* **Saran Proyek & Template Tugas:** Saat membuat proyek, AmbaDo memberikan saran proyek sesuai bidang usaha workspace (misalnya bidang Software House → Aplikasi Absensi Siswa). Setelah proyek dibuat, AmbaDo menawarkan template tugas untuk proyek tersebut; pengguna boleh memakai template atau membuat proyek kosong, dan tugas hasil template dapat diedit atau dihapus. Owner workspace boleh membuat dan mengedit template sendiri.

* **Manajemen Project & Task (CRUD):** Pembuatan, pembaruan, penghapusan, dan pemantauan project serta tugas dengan atribut status, prioritas, deadline, divisi, dan anggota yang bertanggung jawab. Setiap tugas dapat memiliki subtugas. Pembuat proyek otomatis menjadi Owner proyek tersebut.

* **Undangan & Keanggotaan:** Anggota bergabung ke workspace atau proyek melalui undangan email — bukan didaftarkan oleh admin. Owner workspace mengundang Manager atau Ketua Divisi; Ketua Divisi mengundang Anggota ke divisinya. Undangan berlaku 7 hari dan dapat dikirim ulang.

* **Delegasi Tugas Berjenjang:** Pendelegasian tugas dari pemimpin kepada divisi atau langsung kepada anggota, serta pembagian tugas oleh ketua divisi kepada anggota dengan pencatatan riwayat delegasi.

* **Pencarian, Filtering & Paginasi Task:** Penelusuran tugas berdasarkan kata kunci dengan penyaringan berdasarkan status, prioritas, divisi, anggota, dan deadline serta paginasi untuk menangani data dalam jumlah besar. Semua daftar dibatasi pada workspace yang sedang aktif.

* **Dasbor Analitik & Monitoring Progres:** Visualisasi jumlah task, status pekerjaan, tingkat penyelesaian, task terlambat, serta rekapitulasi progres berdasarkan divisi dan anggota — per proyek dan per workspace.

* **Manajemen Lampiran Cloud:** Pengunggahan dan pengelolaan file atau gambar sebagai lampiran tugas menggunakan cloud storage seperti Supabase Storage.

* **Komentar Tugas:** Diskusi pada setiap tugas oleh anggota proyek yang bersangkutan.

## Target Pengguna dan Hak Akses
* **Owner (Pemilik Workspace / Proyek):** Membuat workspace (maksimal satu) dan proyek, memilih bidang usaha, mengundang Manager atau Ketua Divisi, mengelola divisi dan anggota di workspace-nya, serta membuat dan mengedit template dan **role kustom beserta izinnya**. Pembuat proyek otomatis menjadi Owner proyek tersebut.
* **Manager:** Diundang Owner ke sebuah workspace; membuat project/tugas, memberikan project/tugas ke setiap divisi, melihat progress setiap divisi, dan sebagainya.
* **Ketua Divisi:** Memecah tugas dan membagikannya ke anggota-anggota nya, serta mengundang anggota baru ke divisinya dalam proyek tersebut.
* **Anggota:** Melihat tugas yang telah diberikan, mengubah status, memberikan komentar, upload file, dan sebagainya.

Satu pengguna dapat memegang role yang berbeda di workspace yang berbeda — misalnya Owner di workspace sendiri dan Anggota di workspace lain yang mengundangnya.

## Peta Arsitektur dan Alur Peta Aplikasi
```
+------------------------------------------------------------------------+
|                       PUBLIC & AUTHENTICATION                          |
+------------------------------------------------------------------------+
|                                                                        |
| [ Landing Page ] --> [ Register ] --> [ Login ] --> [ JWT Session ]   |
|        (email + password, atau langsung dengan akun Google)            |
|                                                   |                    |
+---------------------------------------------------|--------------------+
                                                    |
                                                    v
+------------------------------------------------------------------------+
|                          ONBOARDING (sekali saja)                      |
+------------------------------------------------------------------------+
|                                                                        |
| [ Buat Workspace ] --> [ Pilih Bidang Usaha ] --> [ Workspace Aktif ]  |
|                                                                        |
+------------------------------------------------------------------------+
                                                    |
                                                    v
                                      +-------------------------+
                                      |    ROLE-BASED ACCESS    |
                                      |  (role per workspace /  |
                                      |   per proyek)           |
                                      +-------------------------+
                                                    |
                         +--------------------------+----------------------+
                         |                                                 |
                         v                                                 v
          +---------------------------+                     +---------------------------+
          |      OWNER WORKSPACE      |                     |      MEMBER WORKSPACE     |
          +---------------------------+                     +---------------------------+
          |                           |                     |                           |
          | 1. Dashboard              |                     | 1. My Tasks               |
          | • Total Task              |                     | • Assigned Task           |
          | • Completed               |                     | • In Progress             |
          | • Overdue                 |                     | • Completed               |
          | • Progress Divisi         |                     |                           |
          |                           |                     | 2. Task Detail            |
          | 2. Project Management     |                     | • Description             |
          | • CRUD Project            |                     | • Deadline                |
          | • Saran Proyek            |                     | • Priority                |
          | • Template Tugas          |                     | • Subtasks                |
          | • CRUD Task               |                     | • Update Status           |
          | • Status & Priority       |                     | • Upload Attachment       |
          |                           |                     | • Comment                 |
          | 3. Undangan & Anggota     |                     |                           |
          | • Undang Manager          |                     | 3. Activity History       |
          | • Undang Ketua Divisi     |                     | • Task History            |
          | • Kelola Anggota          |                     |                           |
          |                           |                     |                           |
          | 4. Manajemen Organisasi   |                     |                           |
          | • Divisi (per workspace)  |                     |                           |
          | • Template                |                     |                           |
          +---------------------------+                     +---------------------------+
                         |                                                 |
                         +--------------------------+----------------------+
                                                    |
                                                    v
+------------------------------------------------------------------------+
|                       CROSS-CUTTING SERVICES                           |
+------------------------------------------------------------------------+
|                                                                        |
| • Client & Server Validation       • Search / Filter / Pagination      |
| • Toast & Error Handling           • JWT & RBAC (per workspace)       |
| • Cloud Storage                    • Activity / Task History           |
| • Analytics & Data Aggregation     • Isolasi Data antar Workspace     |
| • Google OAuth 2.0                 • Undangan (token, 7 hari)         |
|                                                                        |
+------------------------------------------------------------------------+
```

## Migrasi dari Model Lama (v1 → v2)
Model v1 dirancang untuk satu instansi: satu daftar divisi global, satu role global per pengguna, dan peran ADMIN global yang mendaftarkan pengguna. Model v2 (dokumen ini) mengubahnya menjadi multi-tenant:

* Data lama (satu organisasi) dimigrasikan ke satu workspace awal ("Workspace Default") dengan pemiliknya sebagai Owner.
* Tabel `roles` dihapus; role pindah ke keanggotaan per workspace (`workspace_memberships`).
* Pengguna lama tetap dapat login dengan email dan password; pengguna baru dapat memakai Google.
* Endpoint pengguna oleh ADMIN (`POST /users` dan kawan-kawan) digantikan alur undangan.
* Detail lengkap ada di `docs/PRD-AmbaDo.md` dan `docs/api_spesification.md`.

## Teknologi yang digunakan (Tech Stack)
* **Antarmuka Klien (Frontend):** React, Vite,
TypeScript,
Axios,
React Router,
Tailwind CSS. Hosting -> Vercel
* **Layanan Server (Backend):** Node.js,
Express,
TypeScript,
JWT,
bcrypt,
Prisma ORM,
Google OAuth 2.0. Hosting -> Render Free Tier.
* **Basis Data (Database):** PostgreSQL. Hosting -> Supabase Free.
* **Penyimpanan Media & Cloud:** Supabase Storage. Hosting -> Supabase Free.

## Struktur Repositori
Proyek ini menggunakan arsitektur monorepo yang memisahkan layanan menjadi beberapa modul utama:

* **frontend/:** Antarmuka pengguna (UI) interaktif yang dibangun menggunakan React + Vite.
* **backend/:** Core API dan logika bisnis yang dibangun menggunakan Express.js dan PostgreSQL sebagai Database nya. Mengelola auth, session, dan data.

```
PROJECT/
│
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   │
│   ├── workflows/
│   │   └── ci.yml
│   │
│   └── pull_request_template.md
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.ts
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   ├── tests/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── docs/
│   ├── architecture_diagram.png
│   ├── database_schema.png
│   ├── database_schema.sql
│   └── api_spesification.md
│
├── .gitignore
├── LICENSE
└── README.md
```

## Setup Proyek Environment

**Prasyarat Sistem:**

* Node.js versi 24 (atau bisa gunakan NVM), npm, pnpm
  ```
  node -v -> 24
  npm -v
  npm install -g pnpm
  pnpm -v
  ```
* PostgreeSql (lokal / cloud)

**Langkah Setup:**

1. Clone Repository
    ```
   git clone https://github.com/Agus1783/ambawan.git
   cd ambawan
    ```

1. Setup Frontend
    ```
    cd frontend
    pnpm install
    cp .env.example .env
    # Buka file .env dan masukkan VITE_BASE_URL Anda
    ```

1. Setup Backend
    ```
   cd backend
   pnpm install
   cp .env.example .env
   # Buka file .env dan sesuaikan kredensial koneksi DATABASE_URL (PostgreeSQL)
   # Untuk login Google, isi juga GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
   # dan GOOGLE_REDIRECT_URI dari Google Cloud Console
    ```
