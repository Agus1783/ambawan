# AMBADO - Project Mata Kuliah Software Development

## Nama Anggota
1. Wimbuh Agus Alim (QA, DevOps & Integration Specialist)
1. Raihan Anugrah Adrian Arji (Backend & Database Engineer).
1. Andra Putranta Hendiana (Frontend & UI/UX Specialist).

## Deskripsi Singkat Proyek
Ambado merupakan Platform Web Tracking Kegiatan Project Management bagi setiap perusahaan ataupun organisasi yang berfungsi mengelola tugas-tugas tiap pegawai atau divisi. Platform ini memungkinkan pemimpin mendelegasikan tugas secara hierarkis kepada setiap divisi dan anggota, sekaligus memantau progres dan produktivitas melalui dashboard analitik.

## Fitur Utama Sistem / MVP
* **Manajemen Organisasi & Divisi:** Pengelolaan data organisasi, divisi, serta anggota dengan struktur kepemimpinan yang memungkinkan pembagian tugas berdasarkan unit kerja.

* **Manajemen Project & Task (CRUD):** Pembuatan, pembaruan, penghapusan, dan pemantauan project serta tugas dengan atribut status, prioritas, deadline, divisi, dan anggota yang bertanggung jawab.

* **Delegasi Tugas Berjenjang:** Pendelegasian tugas dari pemimpin kepada divisi atau langsung kepada anggota, serta pembagian tugas oleh ketua divisi kepada anggota dengan pencatatan riwayat delegasi.

* **Otentikasi Aman & Otorisasi RBAC:** Register, login, dan logout menggunakan autentikasi berbasis JWT serta pembatasan akses berdasarkan role seperti Administrator, Manager, Ketua Divisi, dan Anggota.

* **Pencarian, Filtering & Paginasi Task:** Penelusuran tugas berdasarkan kata kunci dengan penyaringan berdasarkan status, prioritas, divisi, anggota, dan deadline serta paginasi untuk menangani data dalam jumlah besar.

* **Dasbor Analitik & Monitoring Progres:** Visualisasi jumlah task, status pekerjaan, tingkat penyelesaian, task terlambat, serta rekapitulasi progres berdasarkan divisi dan anggota.

* **Manajemen Lampiran Cloud:** Pengunggahan dan pengelolaan file atau gambar sebagai lampiran tugas menggunakan cloud storage seperti Supabase Storage.

## Target Pengguna dan Hak Akses
* **Administrator:** Bertanggung jawab terhadap sistem secara menyeluruh, seperti mengelola kaun pengguna, membuat/mengelola perusahaan atau organisasi, membuat divisi atau menentukan role pengguna, dan sebagainya.
* **Manager:** Membuat project/tugas, memberikan project/tugas ke setiap divisi, melihat progress setiap divisi, dan sebagainya.
* **Ketua Divisi:** Memecah tugas dan membagikannya ke anggota-anggota nya.
* **Anggota:** Melihat tugas yang telah diberikan, mengubah status, memberikan komentar, upload file, dan sebagainya.

## Peta Arsitektur dan Alur Peta Aplikasi
```
+------------------------------------------------------------------------+
|                       PUBLIC & AUTHENTICATION                          | 
+------------------------------------------------------------------------+
|                                                                        |
| [ Landing Page ] --> [ Register ] --> [ Login ] --> [ JWT Session ]   |
|                                                   |                    |
+---------------------------------------------------|--------------------+
                                                    |
                                                    v
                                      +-------------------------+
                                      |    ROLE-BASED ACCESS    |
                                      +-------------------------+
                                                    |
                         +--------------------------+----------------------+
                         |                                                 |
                         v                                                 v
          +---------------------------+                     +---------------------------+
          |     LEADER WORKSPACE      |                     |      MEMBER WORKSPACE     |
          +---------------------------+                     +---------------------------+
          |                           |                     |                           |
          | 1. Dashboard              |                     | 1. My Tasks               |
          | • Total Task              |                     | • Assigned Task           |
          | • Completed               |                     | • In Progress             |
          | • Overdue                 |                     | • Completed               |
          | • Progress Divisi         |                     |                           |
          |                           |                     | 2. Task Detail            |
          | 2. Project Management     |                     | • Description             |
          | • CRUD Project            |                     | • Deadline                 |
          | • CRUD Task               |                     | • Priority                 |
          | • Status & Priority       |                     | • Update Status            |
          |                           |                     | • Upload Attachment        |
          | 3. Delegasi Tugas         |                     | • Comment                  |
          | • Ke Divisi               |                     |                           |
          | • Ke Anggota              |                     | 3. Activity History       |
          |                           |                     | • Task History             |
          | 4. Manajemen Organisasi   |                     |                           |
          | • Divisi                  |                     |                           |
          | • Anggota                 |                     |                           |
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
| • Toast & Error Handling           • JWT & RBAC                        |
| • Cloud Storage                    • Activity / Task History           |
| • Analytics & Data Aggregation                                         |
|                                                                        |
+------------------------------------------------------------------------+
```

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
Prisma ORM. Hosting -> Render Free Tier.
* **Basis Data (Database):** PostgreSQL. Hosting -> Supabase Free.
* **Penyimpanan Media & Cloud:** Supabase Storage. Hosting -> Supabase Free.

## Struktur Repositori
Proyek ini menggunakan arsitektur monorepo yang memisahkan layanan menjadi beberapa modul utama:

* **frontend/:** Antarmuka pengguna (UI) interaktif yang dibangun menggunakan React + Vite.
* **backend/:** Core API dan logika bisnis yang dibangun menggunakan Express.js dan PostgreSQL sebagai Database nya. Mengelola auth, session, dan data.
