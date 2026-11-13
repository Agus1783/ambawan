# API Specification — Task Management System

**Version:** 2.0.0
**Base Path:** `/api/v1`
**Authentication:** JWT Bearer Token
**Content-Type:** `application/json`

---

# 1. Overview

Task Management System merupakan aplikasi manajemen project dan task multi-tenant ala monday.com dengan fitur:

* Authentication dan JWT, termasuk login dengan akun Google (OAuth 2.0)
* Role-Based Access Control (RBAC) per workspace dan per proyek, termasuk role kustom
* Workspace dan manajemen keanggotaan berbasis undangan
* Bidang usaha, saran proyek, dan template tugas
* Project management
* Task management
* Delegasi tugas berjenjang
* Manajemen divisi
* Task history
* Task attachment
* Task comments
* Search, filtering, dan pagination
* Dashboard analytics

API menggunakan REST architecture dengan format JSON.

Semua data (divisi, project, task, lampiran, riwayat, komentar) terisolasi per workspace. Setiap request ke resource dalam workspace mensyaratkan pemanggil merupakan anggota workspace tersebut. Pengguna yang bukan anggota sebuah workspace tidak dapat melihat data workspace itu.

---

# 2. Role, Permission & Scope

Role tidak lagi global. Role melekat pada keanggotaan (membership) pengguna di sebuah workspace. Pengguna yang sama dapat memegang role yang berbeda di workspace yang berbeda — misalnya OWNER di workspace sendiri dan MEMBER di workspace lain yang mengundangnya.

Peran `ADMIN` global tidak ada lagi.

## 2.1 Katalog Izin

Sistem memiliki 25 izin. Nama izin harus digunakan persis seperti di bawah ini.

| Izin                             | Deskripsi                                            |
| -------------------------------- | ---------------------------------------------------- |
| `workspace.view`                 | Melihat detail workspace                             |
| `workspace.update`               | Mengubah workspace                                   |
| `workspace.delete`               | Menghapus workspace                                  |
| `workspace.manage_divisions`     | Membuat, mengubah, menghapus divisi dan menentukan ketua divisi |
| `workspace.manage_templates`     | Membuat, mengubah, menghapus template proyek dan template tugas |
| `workspace.manage_industries`    | Menambah bidang usaha                                |
| `member.invite`                  | Mengundang pengguna ke workspace atau proyek         |
| `member.manage`                  | Mengubah role anggota, mengeluarkan anggota, dan mengelola role kustom |
| `member.view`                    | Melihat daftar dan detail anggota workspace          |
| `project.create`                 | Membuat project                                      |
| `project.update`                 | Mengubah project                                     |
| `project.delete`                 | Menghapus project                                    |
| `project.view`                   | Melihat project                                      |
| `task.create`                    | Membuat task                                         |
| `task.update`                    | Mengubah task                                        |
| `task.delete`                    | Menghapus task                                       |
| `task.delegate`                  | Mendelegasikan task                                  |
| `task.update_status`             | Mengubah status task                                 |
| `task.view`                      | Melihat task                                         |
| `attachment.upload`              | Mengunggah attachment                                |
| `attachment.delete`              | Menghapus attachment                                 |
| `comment.create`                 | Menulis komentar pada task                           |
| `dashboard.view`                 | Melihat dashboard                                    |
| `analytics.view`                 | Melihat analitik dan statistik task                  |
| `history.view`                   | Melihat task history                                 |

## 2.2 Role Bawaan Sistem

Sistem memiliki empat role bawaan. Role bawaan sistem berlaku untuk semua workspace dan **tidak dapat diubah atau dihapus**.

| Role              | Deskripsi                                     |
| ----------------- | --------------------------------------------- |
| `OWNER`           | Pemilik workspace / proyek                    |
| `MANAGER`         | Mengelola project dan task                    |
| `DIVISION_LEADER` | Mengelola task dan anggota dalam divisinya    |
| `MEMBER`          | Mengerjakan task yang diberikan kepadanya     |

Izin seed masing-masing role bawaan sistem:

**`OWNER` — semua 25 izin:**

```text
workspace.view, workspace.update, workspace.delete,
workspace.manage_divisions, workspace.manage_templates,
workspace.manage_industries,
member.invite, member.manage, member.view,
project.create, project.update, project.delete, project.view,
task.create, task.update, task.delete, task.delegate,
task.update_status, task.view,
attachment.upload, attachment.delete, comment.create,
dashboard.view, analytics.view, history.view
```

**`MANAGER` — 18 izin:**

```text
workspace.view, member.view,
project.create, project.update, project.delete, project.view,
task.create, task.update, task.delete, task.delegate,
task.update_status, task.view,
attachment.upload, attachment.delete, comment.create,
dashboard.view, analytics.view, history.view
```

**`DIVISION_LEADER` — 14 izin:**

```text
workspace.view, member.view, member.invite,
task.create, task.update, task.delete, task.delegate,
task.update_status, task.view,
attachment.upload, attachment.delete, comment.create,
dashboard.view, history.view
```

**`MEMBER` — 8 izin:**

```text
workspace.view, member.view,
task.update_status, task.view,
attachment.upload, comment.create,
dashboard.view, history.view
```

## 2.3 Role Kustom

Owner workspace dapat membuat, mengedit, dan menghapus role kustom beserta izinnya. Izin role kustom dipilih dari katalog izin di §2.1.

* Role kustom hanya berlaku di workspace yang membuatnya.
* Nama role kustom harus unik di dalam workspace tersebut.
* Role kustom yang masih dipakai oleh anggota (membership) atau undangan yang masih pending tidak dapat dihapus.
* Role bawaan sistem tidak dapat diubah, dihapus, atau diberi izin tambahan.

## 2.4 Permission Matrix

Matriks berikut merangkum izin yang dibutuhkan untuk setiap aksi. Izin diperiksa terhadap membership pemanggil di workspace yang bersangkutan.

| Resource / Action          | Izin yang dibutuhkan       |
| -------------------------- | -------------------------- |
| Melihat dashboard          | `dashboard.view`           |
| Melihat analitik task      | `analytics.view`           |
| Melihat anggota workspace  | `member.view`              |
| Mengundang anggota         | `member.invite`            |
| Mengubah role anggota      | `member.manage`            |
| Mengeluarkan anggota       | `member.manage`            |
| Mengelola role kustom      | `member.manage`            |
| Membuat division           | `workspace.manage_divisions` |
| Mengubah division          | `workspace.manage_divisions` |
| Menghapus division         | `workspace.manage_divisions` |
| Menentukan division leader | `workspace.manage_divisions` |
| Membuat project            | `project.create`           |
| Mengubah project           | `project.update`           |
| Menghapus project          | `project.delete`           |
| Melihat project            | `project.view`             |
| Membuat task               | `task.create`              |
| Mengubah task              | `task.update`              |
| Menghapus task             | `task.delete`              |
| Delegasi task              | `task.delegate`            |
| Update status task         | `task.update_status`       |
| Melihat task history       | `history.view`             |
| Upload attachment          | `attachment.upload`        |
| Menghapus attachment       | `attachment.delete`        |
| Menulis komentar           | `comment.create`           |
| Menambah bidang usaha      | `workspace.manage_industries` |
| Mengelola template         | `workspace.manage_templates` |

## 2.5 Aturan Scope

Backend **tidak boleh hanya mengandalkan role** untuk menentukan akses. Selain pengecekan izin, backend harus melakukan pengecekan terhadap relasi resource dan keanggotaan workspace.

* Setiap akses ke resource workspace mensyaratkan pemanggil adalah anggota workspace tersebut. Bukan anggota → `403 Forbidden` (`WORKSPACE_NOT_MEMBER`) atau `404 Not Found` bila resource tidak boleh diketahui keberadaannya.
* Tepat satu OWNER per workspace. Pembuat workspace otomatis mendapat role OWNER sistem. Perubahan role yang akan menciptakan OWNER kedua ditolak. Role OWNER sistem tidak dapat diberikan melalui undangan.
* `OWNER` (workspace) memiliki semua izin di workspace tersebut. `OWNER` proyek adalah pembuat proyek (Owner workspace atau Manager yang diundang) dan memiliki izin penuh atas proyek tersebut.
* `MANAGER` dapat mengelola seluruh task dalam project yang dikelolanya; dapat memberikan task langsung kepada user; dapat memberikan task kepada division.
* `DIVISION_LEADER` hanya dapat melihat dan mengelola task yang diberikan kepada divisinya atau dirinya, serta subtask di bawah kewenangannya; tidak dapat mengubah atau menghapus task milik division lain; tidak dapat mengubah struktur project. `DIVISION_LEADER` dapat mengundang anggota ke divisinya dalam proyek.
* `MEMBER` hanya dapat melihat task yang diberikan kepadanya; dapat memperbarui status task miliknya; dapat mengunggah attachment dan menulis komentar pada task miliknya; tidak dapat menghapus task; tidak dapat mendelegasikan task.

Contoh:

```text
DIVISION_LEADER IT (workspace A)
       │
       ├── boleh → Task Division IT di workspace A
       │
       ├── tidak boleh → Task Division Marketing di workspace A
       │
       └── tidak boleh → Task apa pun di workspace B (bukan anggota)
```

---

# 3. Authentication

Semua endpoint yang membutuhkan authentication menggunakan:

```http
Authorization: Bearer <JWT_TOKEN>
```

Contoh:

```http
GET /api/v1/tasks?workspace_id=ws_01ABC
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

JWT minimal menyimpan:

```json
{
  "sub": "usr_01ABC",
  "iat": 1780000000,
  "exp": 1780003600
}
```

`sub` berisi ID user. JWT **tidak** menyimpan role, karena role bersifat per workspace dan diselesaikan dari `workspace_memberships` pada setiap request.

---

# 4. Standard Response

## 4.1 Success Response

```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "data": {}
}
```

## 4.2 Error Response

```json
{
  "success": false,
  "message": "Task tidak ditemukan",
  "error": {
    "code": "TASK_NOT_FOUND",
    "details": null
  }
}
```

## 4.3 Validation Error

```json
{
  "success": false,
  "message": "Data yang dikirim tidak valid",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "title": "Title wajib diisi",
      "deadline": "Deadline tidak valid"
    }
  }
}
```

---

# 5. HTTP Status Codes

| Status                      | Penggunaan                                    |
| --------------------------- | --------------------------------------------- |
| `200 OK`                    | Request berhasil                              |
| `201 Created`               | Resource berhasil dibuat                      |
| `204 No Content`            | Resource berhasil dihapus tanpa response body |
| `400 Bad Request`           | Request tidak valid                           |
| `401 Unauthorized`          | Belum login / JWT tidak valid                 |
| `403 Forbidden`             | Tidak memiliki permission                     |
| `404 Not Found`             | Resource tidak ditemukan                      |
| `409 Conflict`              | Konflik data                                  |
| `422 Unprocessable Entity`  | Validation error                              |
| `500 Internal Server Error` | Kesalahan server                              |

---

# 6. Authentication API

## 6.1 Register

### `POST /auth/register`

Mendaftarkan user baru.

**Authentication:** Tidak diperlukan.

**Request:**

```json
{
  "name": "Andi",
  "email": "andi@example.com",
  "password": "Password123"
}
```

Register tidak menentukan role. User baru tidak memiliki role global; role didapatkan setelah membuat workspace (menjadi OWNER) atau menerima undangan ke workspace lain. Setelah register, user diarahkan ke onboarding untuk membuat workspace (`POST /workspaces`).

Bila email yang didaftarkan sudah pernah diundang ke sebuah workspace, membership untuk undangan tersebut dibuat otomatis setelah register berhasil.

**Response `201`:**

```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": {
    "id": "usr_01ABC",
    "name": "Andi",
    "email": "andi@example.com",
    "auth_provider": "EMAIL",
    "onboarding_completed": false
  }
}
```

**Error:**

| Status | Code                 | Keterangan              |
| ------ | -------------------- | ----------------------- |
| `409`  | `EMAIL_ALREADY_EXISTS` | Email sudah digunakan |

---

## 6.2 Login

### `POST /auth/login`

**Authentication:** Tidak diperlukan.

**Request:**

```json
{
  "email": "andi@example.com",
  "password": "Password123"
}
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": "usr_01ABC",
      "name": "Andi",
      "email": "andi@example.com",
      "auth_provider": "EMAIL",
      "onboarding_completed": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error:**

| Status | Code                | Keterangan             |
| ------ | ------------------- | ---------------------- |
| `401`  | `INVALID_CREDENTIALS` | Email/password salah |

---

## 6.3 Logout

### `POST /auth/logout`

**Authentication:** 🔐 Required

JWT bersifat stateless. Implementasi logout dapat menggunakan mekanisme token expiration/revocation sesuai kebutuhan backend.

**Response `200`:**

```json
{
  "success": true,
  "message": "Logout berhasil",
  "data": null
}
```

---

## 6.4 Get Current User

### `GET /auth/me`

Mengambil informasi user yang sedang login.

**Authentication:** 🔐 Required

**Response `200`:**

```json
{
  "success": true,
  "message": "Data user berhasil diambil",
  "data": {
    "id": "usr_01ABC",
    "name": "Andi",
    "email": "andi@example.com",
    "auth_provider": "EMAIL",
    "onboarding_completed": true
  }
}
```

---

## 6.5 Login dengan Google

### `POST /auth/google`

Login atau register dengan akun Google. Frontend melakukan Google OAuth 2.0 (authorization code flow) dan mengirimkan Google ID token ke endpoint ini. Backend memverifikasi token ke Google, lalu membuat atau mencocokkan pengguna berdasarkan `google_id` atau email, dan menerbitkan JWT AmbaDo seperti login biasa.

**Authentication:** Tidak diperlukan.

**Request:**

```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

Aturan pencocokan pengguna:

* Bila `google_id` sudah terdaftar → login sebagai user tersebut.
* Bila `google_id` belum terdaftar tetapi email sudah terdaftar → akun yang ada ditautkan ke Google (`google_id` diisi, `auth_provider` tetap `EMAIL` bila akun dibuat dengan email, atau menjadi `GOOGLE` bila akun dibuat lewat Google).
* Bila email belum terdaftar → user baru dibuat dengan `auth_provider` `GOOGLE`, tanpa password. User baru diarahkan ke onboarding untuk membuat workspace.

**Response `200` (login) atau `201` (user baru dibuat):**

```json
{
  "success": true,
  "message": "Login dengan Google berhasil",
  "data": {
    "user": {
      "id": "usr_01ABC",
      "name": "Andi",
      "email": "andi@example.com",
      "auth_provider": "GOOGLE",
      "onboarding_completed": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error:**

| Status | Code                | Keterangan                      |
| ------ | ------------------- | ------------------------------- |
| `401`  | `GOOGLE_AUTH_FAILED` | Token Google tidak valid        |
| `400`  | `VALIDATION_ERROR`   | `id_token` wajib diisi          |

---

# 7. Users API

> **Catatan:** endpoint `POST /users`, `PUT /users/:id`, dan `DELETE /users/:id` dari v1 **dihapus**. Pengguna tidak lagi dibuat, diubah, atau dihapus oleh admin. Anggota bergabung ke workspace melalui undangan (§11) dan dikelola melalui membership workspace (§8). Daftar pengguna sebuah workspace diambil lewat `GET /workspaces/:id/members` (§8.6).

## 7.1 Get User Detail

### `GET /users/:id`

Mengambil detail satu user. Pemanggil dan user yang dituju harus berada di workspace yang sama (memiliki setidaknya satu workspace bersama). Bila tidak ada workspace bersama, endpoint mengembalikan `404 Not Found` agar keberadaan user tidak bocor ke pihak luar.

**Authentication:** 🔐 Required

**Permission:** `member.view` (di salah satu workspace bersama)

**Response `200`:**

```json
{
  "success": true,
  "message": "Data user berhasil diambil",
  "data": {
    "id": "usr_01ABC",
    "name": "Andi",
    "email": "andi@example.com",
    "auth_provider": "EMAIL",
    "onboarding_completed": true,
    "workspaces": [
      {
        "id": "ws_01ABC",
        "name": "PT Maju Bersama",
        "role": {
          "id": "role_member",
          "name": "MEMBER",
          "is_system": true
        }
      }
    ]
  }
}
```

**Error:**

| Status | Code             | Keterangan                        |
| ------ | ---------------- | --------------------------------- |
| `404`  | `USER_NOT_FOUND` | User tidak ditemukan atau tidak satu workspace dengan pemanggil |

---

# 8. Workspaces API

## 8.1 Create Workspace

### `POST /workspaces`

Membuat workspace baru. Satu akun hanya boleh memiliki **satu** workspace yang dibuatnya sendiri. Pembuat workspace otomatis menjadi OWNER workspace tersebut (membership dengan role OWNER sistem dibuat otomatis) dan `onboarding_completed` pengguna menjadi `true`.

**Authentication:** 🔐 Required

**Permission:** Semua user yang sudah login (tidak butuh izin khusus). Batas satu workspace ditegakkan di endpoint ini.

**Request:**

```json
{
  "name": "PT Maju Bersama",
  "industry_id": "ind_software"
}
```

`industry_id` wajib diisi dan harus merujuk ke bidang usaha yang ada (§9).

**Response `201`:**

```json
{
  "success": true,
  "message": "Workspace berhasil dibuat",
  "data": {
    "id": "ws_01ABC",
    "name": "PT Maju Bersama",
    "industry": {
      "id": "ind_software",
      "name": "Software House"
    },
    "owner_id": "usr_01ABC",
    "role": {
      "id": "role_owner",
      "name": "OWNER",
      "is_system": true
    }
  }
}
```

**Error:**

| Status | Code                      | Keterangan                                        |
| ------ | ------------------------- | ------------------------------------------------- |
| `409`  | `WORKSPACE_LIMIT_REACHED` | User sudah memiliki satu workspace                |
| `404`  | `INDUSTRY_NOT_FOUND`      | `industry_id` tidak ditemukan                     |
| `400`  | `VALIDATION_ERROR`        | `name` atau `industry_id` tidak valid             |

---

## 8.2 Get My Workspaces

### `GET /workspaces`

Mengambil daftar workspace yang diikuti pengguna: workspace yang dibuatnya sendiri dan workspace lain yang ia ikuti melalui undangan. Dipakai oleh workspace switcher di frontend.

**Authentication:** 🔐 Required

**Permission:** Semua user yang sudah login.

Query:

```text
?page=1
&limit=10
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Data workspace berhasil diambil",
  "data": [
    {
      "id": "ws_01ABC",
      "name": "PT Maju Bersama",
      "industry": {
        "id": "ind_software",
        "name": "Software House"
      },
      "owner_id": "usr_01ABC",
      "is_owner": true,
      "role": {
        "id": "role_owner",
        "name": "OWNER",
        "is_system": true
      }
    },
    {
      "id": "ws_02DEF",
      "name": "Sekolah Cendekia",
      "industry": {
        "id": "ind_pendidikan",
        "name": "Pendidikan"
      },
      "owner_id": "usr_09ZZZ",
      "is_owner": false,
      "role": {
        "id": "role_member",
        "name": "MEMBER",
        "is_system": true
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

---

## 8.3 Get Workspace Detail

### `GET /workspaces/:id`

**Authentication:** 🔐 Required

**Permission:** `workspace.view` (pemanggil harus anggota workspace)

**Response `200`:**

```json
{
  "success": true,
  "message": "Data workspace berhasil diambil",
  "data": {
    "id": "ws_01ABC",
    "name": "PT Maju Bersama",
    "industry": {
      "id": "ind_software",
      "name": "Software House"
    },
    "owner_id": "usr_01ABC",
    "memberCount": 5
  }
}
```

**Error:**

| Status | Code                  | Keterangan                          |
| ------ | --------------------- | ----------------------------------- |
| `404`  | `WORKSPACE_NOT_FOUND` | Workspace tidak ditemukan           |
| `403`  | `WORKSPACE_NOT_MEMBER` | Pemanggil bukan anggota workspace  |

---

## 8.4 Update Workspace

### `PUT /workspaces/:id`

**Authentication:** 🔐 Required

**Permission:** `workspace.update`

**Request:**

```json
{
  "name": "PT Maju Bersama Digital",
  "industry_id": "ind_software"
}
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Workspace berhasil diperbarui",
  "data": {
    "id": "ws_01ABC",
    "name": "PT Maju Bersama Digital",
    "industry": {
      "id": "ind_software",
      "name": "Software House"
    },
    "owner_id": "usr_01ABC"
  }
}
```

---

## 8.5 Delete Workspace

### `DELETE /workspaces/:id`

**Authentication:** 🔐 Required

**Permission:** `workspace.delete`

Menghapus workspace akan menghapus seluruh data di dalamnya (divisi, project, task, undangan) mengikuti aturan `ON DELETE CASCADE` di database. Setelah workspace dihapus, pemilik dapat membuat workspace baru.

**Response `204`:**

No response body.

---

## 8.6 Get Workspace Members

### `GET /workspaces/:id/members`

**Authentication:** 🔐 Required

**Permission:** `member.view`

Query:

```text
?page=1
&limit=10
&search=andi
&role_id=role_member
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Anggota workspace berhasil diambil",
  "data": [
    {
      "id": "usr_01ABC",
      "name": "Andi",
      "email": "andi@example.com",
      "role": {
        "id": "role_owner",
        "name": "OWNER",
        "is_system": true
      }
    },
    {
      "id": "usr_02ABC",
      "name": "Budi",
      "email": "budi@example.com",
      "role": {
        "id": "role_member",
        "name": "MEMBER",
        "is_system": true
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

---

## 8.7 Update Member Role

### `PUT /workspaces/:id/members/:userId/role`

Mengubah role seorang anggota workspace, misalnya mengangkat MEMBER menjadi DIVISION_LEADER. Perubahan role adalah perubahan data biasa.

**Authentication:** 🔐 Required

**Permission:** `member.manage`

**Request:**

```json
{
  "role_id": "role_leader"
}
```

Aturan:

* Role OWNER sistem tidak dapat diberikan kepada anggota lain melalui endpoint ini. Tepat satu OWNER per workspace ditegakkan aplikasi.
* Role anggota yang merupakan OWNER workspace tidak dapat diubah melalui endpoint ini.
* Bila role baru adalah DIVISION_LEADER, ketua divisi yang dipimpinnya ditentukan lewat `PUT /divisions/:id/leader` (§12.7). Mengubah role tidak otomatis mengubah `leader_id` divisi.

**Response `200`:**

```json
{
  "success": true,
  "message": "Role anggota berhasil diperbarui",
  "data": {
    "id": "usr_02ABC",
    "name": "Budi",
    "email": "budi@example.com",
    "role": {
      "id": "role_leader",
      "name": "DIVISION_LEADER",
      "is_system": true
    }
  }
}
```

**Error:**

| Status | Code               | Keterangan                                     |
| ------ | ------------------ | ---------------------------------------------- |
| `404`  | `USER_NOT_FOUND`   | Anggota tidak ditemukan di workspace ini       |
| `404`  | `ROLE_NOT_FOUND`   | `role_id` tidak ditemukan                      |
| `403`  | `FORBIDDEN`        | Mencoba mengubah role OWNER atau memberikan role OWNER |
| `403`  | `ROLE_NOT_IN_WORKSPACE` | Role kustom bukan milik workspace ini     |

---

## 8.8 Remove Member

### `DELETE /workspaces/:id/members/:userId`

Mengeluarkan anggota dari workspace. Mengeluarkan anggota hanya menghapus membership-nya; data yang dibuat anggota tersebut (task, komentar, lampiran) tetap tersimpan. Anggota yang dikeluarkan kehilangan akses ke seluruh data workspace tersebut.

**Authentication:** 🔐 Required

**Permission:** `member.manage`

Aturan:

* OWNER workspace tidak dapat dikeluarkan dari workspace-nya sendiri.
* Mengeluarkan anggota yang merupakan ketua divisi akan mengosongkan `leader_id` divisi yang dipimpinnya (`ON DELETE SET NULL` tidak berlaku di sini karena yang dihapus adalah membership, bukan user; backend wajib mengosongkan `leader_id` terkait).

**Response `204`:**

No response body.

**Error:**

| Status | Code             | Keterangan                                |
| ------ | ---------------- | ----------------------------------------- |
| `404`  | `USER_NOT_FOUND` | Anggota tidak ditemukan di workspace ini  |
| `403`  | `FORBIDDEN`      | Mencoba mengeluarkan OWNER workspace      |

---

# 9. Industries & Project Suggestions API

## 9.1 Get Industries

### `GET /industries`

Mengambil daftar bidang usaha. Bidang usaha dipakai saat membuat workspace dan sebagai dasar saran proyek.

**Authentication:** 🔐 Required

**Permission:** Semua user yang sudah login.

Query:

```text
?page=1
&limit=10
&search=software
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Data bidang usaha berhasil diambil",
  "data": [
    {
      "id": "ind_software",
      "name": "Software House",
      "description": "Pengembangan perangkat lunak dan layanan IT",
      "is_system": true
    },
    {
      "id": "ind_pendidikan",
      "name": "Pendidikan",
      "description": "Sekolah, kampus, dan lembaga kursus",
      "is_system": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 7,
    "totalPages": 1
  }
}
```

---

## 9.2 Create Industry

### `POST /industries`

Menambah bidang usaha baru. Bidang usaha yang ditambahkan Owner menjadi bagian dari daftar bidang usaha dan dapat dipilih workspace lain.

**Authentication:** 🔐 Required

**Permission:** `workspace.manage_industries` (di salah satu workspace yang diikuti pemanggil)

**Request:**

```json
{
  "name": "Agrikultur",
  "description": "Pertanian, perkebunan, dan peternakan"
}
```

Nama bidang usaha yang sama boleh ditambahkan oleh pemilik yang berbeda (unique constraint `name` + `created_by` di database).

**Response `201`:**

```json
{
  "success": true,
  "message": "Bidang usaha berhasil ditambahkan",
  "data": {
    "id": "ind_agrikultur",
    "name": "Agrikultur",
    "description": "Pertanian, perkebunan, dan peternakan",
    "is_system": false
  }
}
```

**Error:**

| Status | Code               | Keterangan                          |
| ------ | ------------------ | ----------------------------------- |
| `409`  | `RESOURCE_CONFLICT` | Nama bidang usaha sudah ada untuk pemilik yang sama |

---

## 9.3 Get Project Suggestions

### `GET /industries/:id/project-suggestions`

Mengambil saran proyek untuk satu bidang usaha. Saran berasal dari `project_templates` yang dikaitkan dengan bidang usaha tersebut. Pengguna boleh memakai saran atau mengabaikannya dan menulis nama proyek sendiri.

**Authentication:** 🔐 Required

**Permission:** Semua user yang sudah login.

**Response `200`:**

```json
{
  "success": true,
  "message": "Saran proyek berhasil diambil",
  "data": [
    {
      "id": "ptpl_absensi",
      "name": "Aplikasi Absensi Siswa",
      "description": "Sistem pencatatan kehadiran siswa berbasis web",
      "industry": {
        "id": "ind_software",
        "name": "Software House"
      }
    },
    {
      "id": "ptpl_akademik",
      "name": "Sistem Informasi Akademik",
      "description": "Pengelolaan data akademik sekolah atau kampus",
      "industry": {
        "id": "ind_software",
        "name": "Software House"
      }
    }
  ]
}
```

**Error:**

| Status | Code                 | Keterangan                     |
| ------ | -------------------- | ------------------------------ |
| `404`  | `INDUSTRY_NOT_FOUND` | Bidang usaha tidak ditemukan   |

---

# 10. Roles & Permissions API

## 10.1 Get Permission Catalog

### `GET /permissions`

Mengambil katalog izin sistem (25 izin, lihat §2.1). Dipakai frontend saat Owner membuat atau mengedit role kustom.

**Authentication:** 🔐 Required

**Permission:** Semua user yang sudah login.

**Response `200`:**

```json
{
  "success": true,
  "message": "Katalog izin berhasil diambil",
  "data": [
    {
      "permission": "workspace.view",
      "description": "Melihat detail workspace"
    },
    {
      "permission": "project.create",
      "description": "Membuat project"
    }
  ]
}
```

---

## 10.2 Get Workspace Roles

### `GET /workspaces/:id/roles`

Mengambil daftar role di sebuah workspace: role bawaan sistem beserta role kustom milik workspace tersebut, masing-masing dengan daftar izinnya.

**Authentication:** 🔐 Required

**Permission:** `member.view`

**Response `200`:**

```json
{
  "success": true,
  "message": "Data role berhasil diambil",
  "data": [
    {
      "id": "role_owner",
      "name": "OWNER",
      "description": "Pemilik workspace/proyek",
      "is_system": true,
      "permissions": [
        "workspace.view",
        "workspace.update",
        "workspace.delete",
        "workspace.manage_divisions",
        "workspace.manage_templates",
        "workspace.manage_industries",
        "member.invite",
        "member.manage",
        "member.view",
        "project.create",
        "project.update",
        "project.delete",
        "project.view",
        "task.create",
        "task.update",
        "task.delete",
        "task.delegate",
        "task.update_status",
        "task.view",
        "attachment.upload",
        "attachment.delete",
        "comment.create",
        "dashboard.view",
        "analytics.view",
        "history.view"
      ]
    },
    {
      "id": "role_qa",
      "name": "QA Lead",
      "description": "Memimpin pengujian kualitas",
      "is_system": false,
      "permissions": [
        "workspace.view",
        "member.view",
        "task.view",
        "task.update_status",
        "comment.create",
        "dashboard.view",
        "history.view"
      ]
    }
  ]
}
```

---

## 10.3 Create Custom Role

### `POST /workspaces/:id/roles`

Membuat role kustom baru di sebuah workspace. Izin dipilih dari katalog izin sistem (§2.1 / `GET /permissions`).

**Authentication:** 🔐 Required

**Permission:** `member.manage`

**Request:**

```json
{
  "name": "QA Lead",
  "description": "Memimpin pengujian kualitas",
  "permissions": [
    "workspace.view",
    "member.view",
    "task.view",
    "task.update_status",
    "comment.create",
    "dashboard.view",
    "history.view"
  ]
}
```

**Response `201`:**

```json
{
  "success": true,
  "message": "Role berhasil dibuat",
  "data": {
    "id": "role_qa",
    "name": "QA Lead",
    "description": "Memimpin pengujian kualitas",
    "is_system": false,
    "permissions": [
      "workspace.view",
      "member.view",
      "task.view",
      "task.update_status",
      "comment.create",
      "dashboard.view",
      "history.view"
    ]
  }
}
```

**Error:**

| Status | Code                | Keterangan                                        |
| ------ | ------------------- | ------------------------------------------------- |
| `400`  | `VALIDATION_ERROR`  | Nama wajib diisi, atau ada izin di luar katalog   |
| `409`  | `RESOURCE_CONFLICT` | Nama role sudah dipakai di workspace ini          |

---

## 10.4 Get Role Detail

### `GET /workspaces/:id/roles/:roleId`

**Authentication:** 🔐 Required

**Permission:** `member.view`

**Response `200`:**

```json
{
  "success": true,
  "message": "Data role berhasil diambil",
  "data": {
    "id": "role_manager",
    "name": "MANAGER",
    "description": "Mengelola project dan task",
    "is_system": true,
    "permissions": [
      "workspace.view",
      "member.view",
      "project.create",
      "project.update",
      "project.delete",
      "project.view",
      "task.create",
      "task.update",
      "task.delete",
      "task.delegate",
      "task.update_status",
      "task.view",
      "attachment.upload",
      "attachment.delete",
      "comment.create",
      "dashboard.view",
      "analytics.view",
      "history.view"
    ]
  }
}
```

**Error:**

| Status | Code             | Keterangan                  |
| ------ | ---------------- | --------------------------- |
| `404`  | `ROLE_NOT_FOUND` | Role tidak ditemukan        |

---

## 10.5 Update Custom Role

### `PUT /workspaces/:id/roles/:roleId`

Mengubah nama, deskripsi, dan/atau daftar izin sebuah role kustom. Perubahan izin berlaku langsung untuk semua anggota yang memegang role tersebut.

**Authentication:** 🔐 Required

**Permission:** `member.manage`

**Request:**

```json
{
  "name": "QA Lead",
  "description": "Memimpin pengujian kualitas dan rilis",
  "permissions": [
    "workspace.view",
    "member.view",
    "task.view",
    "task.update_status",
    "task.update",
    "comment.create",
    "dashboard.view",
    "history.view"
  ]
}
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Role berhasil diperbarui",
  "data": {
    "id": "role_qa",
    "name": "QA Lead",
    "description": "Memimpin pengujian kualitas dan rilis",
    "is_system": false,
    "permissions": [
      "workspace.view",
      "member.view",
      "task.view",
      "task.update_status",
      "task.update",
      "comment.create",
      "dashboard.view",
      "history.view"
    ]
  }
}
```

**Error:**

| Status | Code                    | Keterangan                                |
| ------ | ----------------------- | ----------------------------------------- |
| `404`  | `ROLE_NOT_FOUND`        | Role tidak ditemukan                      |
| `403`  | `ROLE_SYSTEM_PROTECTED` | Role bawaan sistem tidak dapat diubah     |
| `409`  | `RESOURCE_CONFLICT`     | Nama role sudah dipakai di workspace ini  |

---

## 10.6 Delete Custom Role

### `DELETE /workspaces/:id/roles/:roleId`

Menghapus role kustom. Role yang masih dipakai oleh anggota (membership) atau undangan yang masih pending tidak dapat dihapus.

**Authentication:** 🔐 Required

**Permission:** `member.manage`

**Response `204`:**

No response body.

**Error:**

| Status | Code                    | Keterangan                                        |
| ------ | ----------------------- | ------------------------------------------------- |
| `404`  | `ROLE_NOT_FOUND`        | Role tidak ditemukan                              |
| `403`  | `ROLE_SYSTEM_PROTECTED` | Role bawaan sistem tidak dapat dihapus            |
| `409`  | `ROLE_IN_USE`           | Role masih dipakai anggota atau undangan pending  |

---

# 11. Invitations API

Undangan adalah cara anggota bergabung ke workspace atau proyek. Undangan dikirim lewat email dan berisi token unik.

**Masa berlaku:** undangan berlaku **7 hari** sejak dibuat (`expires_at`). Undangan yang tidak diterima dalam 7 hari berubah status menjadi `EXPIRED` dan tokennya tidak lagi berlaku.

**Status undangan:**

| Status     | Keterangan                                      |
| ---------- | ----------------------------------------------- |
| `PENDING`  | Menunggu jawaban penerima                       |
| `ACCEPTED` | Diterima; membership sudah dibuat               |
| `EXPIRED`  | Kedaluwarsa (lewat 7 hari tanpa jawaban)        |
| `DECLINED` | Ditolak penerima                                |

**Alur untuk penerima yang belum punya akun:** penerima mendaftar lewat `POST /auth/register` dengan email yang sama dengan email undangan. Setelah register berhasil, membership untuk undangan tersebut dibuat otomatis (undangan berubah menjadi `ACCEPTED`). Alternatifnya, penerima dapat login terlebih dahulu lalu menerima undangan lewat `POST /invitations/:token/accept`.

## 11.1 Create Invitation

### `POST /workspaces/:id/invitations`

Mengundang pengguna lewat email ke workspace atau ke satu proyek tertentu.

**Authentication:** 🔐 Required

**Permission:** `member.invite`

**Request:**

```json
{
  "email": "sinta@example.com",
  "role_id": "role_manager",
  "project_id": "prj_01ABC"
}
```

* `role_id` wajib diisi dan harus merujuk ke role bawaan sistem atau role kustom milik workspace ini. Role OWNER sistem **tidak dapat diundang**.
* `project_id` bersifat opsional. Bila diisi, undangan berlaku untuk proyek tersebut; bila kosong, undangan berlaku untuk workspace.
* Bila `project_id` diisi, pengundang harus memiliki izin atas proyek tersebut.
* Mengundang email yang sudah menjadi anggota workspace yang sama akan ditolak (`409 RESOURCE_CONFLICT`).

**Response `201`:**

```json
{
  "success": true,
  "message": "Undangan berhasil dikirim",
  "data": {
    "id": "inv_01ABC",
    "workspace_id": "ws_01ABC",
    "project_id": "prj_01ABC",
    "email": "sinta@example.com",
    "role": {
      "id": "role_manager",
      "name": "MANAGER",
      "is_system": true
    },
    "status": "PENDING",
    "expires_at": "2026-11-20T10:00:00Z"
  }
}
```

Token undangan tidak pernah dikembalikan lewat API; token dikirim ke email penerima.

**Error:**

| Status | Code                      | Keterangan                                              |
| ------ | ------------------------- | ------------------------------------------------------- |
| `404`  | `ROLE_NOT_FOUND`          | `role_id` tidak ditemukan                               |
| `403`  | `ROLE_NOT_IN_WORKSPACE`   | Role kustom bukan milik workspace ini                   |
| `400`  | `VALIDATION_ERROR`        | Role OWNER tidak dapat diundang                         |
| `404`  | `PROJECT_NOT_FOUND`       | `project_id` tidak ditemukan                            |
| `409`  | `RESOURCE_CONFLICT`       | Email sudah menjadi anggota workspace ini               |

---

## 11.2 Get Workspace Invitations

### `GET /workspaces/:id/invitations`

Mengambil daftar undangan sebuah workspace beserta statusnya.

**Authentication:** 🔐 Required

**Permission:** `member.view`

Query:

```text
?page=1
&limit=10
&status=PENDING
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Data undangan berhasil diambil",
  "data": [
    {
      "id": "inv_01ABC",
      "workspace_id": "ws_01ABC",
      "project_id": "prj_01ABC",
      "email": "sinta@example.com",
      "role": {
        "id": "role_manager",
        "name": "MANAGER",
        "is_system": true
      },
      "status": "PENDING",
      "invited_by": {
        "id": "usr_01ABC",
        "name": "Andi"
      },
      "expires_at": "2026-11-20T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## 11.3 Accept Invitation

### `POST /invitations/:token/accept`

Menerima undangan. Membership penerima di workspace tersebut dibuat dengan role yang tercantum pada undangan. Bila undangan ditujukan ke proyek tertentu, penerima menjadi anggota proyek tersebut.

**Authentication:** 🔐 Required

**Request:**

```json
{}
```

Body kosong. Token diambil dari path.

Aturan:

* Email pengguna yang login harus sama dengan email pada undangan.
* Undangan yang sudah kedaluwarsa tidak dapat diterima.
* Undangan yang sudah diterima atau ditolak tidak dapat diterima lagi.

**Response `200`:**

```json
{
  "success": true,
  "message": "Undangan berhasil diterima",
  "data": {
    "workspace": {
      "id": "ws_01ABC",
      "name": "PT Maju Bersama"
    },
    "project": {
      "id": "prj_01ABC",
      "name": "Sistem Absensi"
    },
    "role": {
      "id": "role_manager",
      "name": "MANAGER",
      "is_system": true
    }
  }
}
```

Bila undangan ditujukan ke workspace (tanpa `project_id`), field `project` bernilai `null`.

**Error:**

| Status | Code                 | Keterangan                                        |
| ------ | -------------------- | ------------------------------------------------- |
| `404`  | `INVITATION_INVALID` | Token undangan tidak ditemukan                    |
| `400`  | `INVITATION_EXPIRED` | Undangan sudah kedaluwarsa (lewat 7 hari)         |
| `403`  | `FORBIDDEN`          | Email pengguna login tidak sama dengan email undangan |
| `409`  | `RESOURCE_CONFLICT`  | Undangan sudah diterima atau ditolak sebelumnya   |

---

## 11.4 Decline Invitation

### `POST /invitations/:token/decline`

Menolak undangan. Status undangan berubah menjadi `DECLINED` dan token tidak lagi berlaku.

**Authentication:** 🔐 Required

**Request:**

```json
{}
```

Body kosong. Token diambil dari path.

**Response `200`:**

```json
{
  "success": true,
  "message": "Undangan berhasil ditolak",
  "data": {
    "id": "inv_01ABC",
    "status": "DECLINED"
  }
}
```

**Error:**

| Status | Code                 | Keterangan                                     |
| ------ | -------------------- | ---------------------------------------------- |
| `404`  | `INVITATION_INVALID` | Token undangan tidak ditemukan                 |
| `400`  | `INVITATION_EXPIRED` | Undangan sudah kedaluwarsa (lewat 7 hari)      |
| `409`  | `RESOURCE_CONFLICT`  | Undangan sudah diterima atau ditolak sebelumnya |

---

## 11.5 Resend Invitation

### `POST /invitations/:id/resend`

Mengirim ulang undangan. Pengiriman ulang membuat token baru dan `expires_at` baru (7 hari dari waktu pengiriman ulang); token lama tidak lagi berlaku dan undangan lama ditandai `EXPIRED`.

**Authentication:** 🔐 Required

**Permission:** `member.invite`

**Request:**

```json
{}
```

Body kosong.

**Response `200`:**

```json
{
  "success": true,
  "message": "Undangan berhasil dikirim ulang",
  "data": {
    "id": "inv_01ABC",
    "email": "sinta@example.com",
    "status": "PENDING",
    "expires_at": "2026-11-20T10:00:00Z"
  }
}
```

**Error:**

| Status | Code                | Keterangan                                       |
| ------ | ------------------- | ------------------------------------------------ |
| `404`  | `INVITATION_INVALID` | Undangan tidak ditemukan                        |
| `409`  | `RESOURCE_CONFLICT` | Hanya undangan berstatus PENDING yang dapat dikirim ulang |

---

# 12. Divisions API

Divisi berada di dalam satu workspace. Nama divisi unik per workspace: dua workspace boleh sama-sama memiliki divisi bernama "IT".

## 12.1 Get Divisions

### `GET /divisions`

**Authentication:** 🔐 Required

**Permission:** `workspace.view`

Query:

```text
?workspace_id=ws_01ABC
&page=1
&limit=10
&search=IT
```

`workspace_id` wajib diisi. Hanya divisi di workspace tersebut yang dikembalikan.

**Response:**

```json
{
  "success": true,
  "message": "Data division berhasil diambil",
  "data": [
    {
      "id": "div_01ABC",
      "workspace_id": "ws_01ABC",
      "name": "IT",
      "leader": {
        "id": "usr_01ABC",
        "name": "Budi"
      },
      "memberCount": 4
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

**Error:**

| Status | Code               | Keterangan                          |
| ------ | ------------------ | ----------------------------------- |
| `400`  | `VALIDATION_ERROR` | `workspace_id` wajib diisi          |
| `403`  | `WORKSPACE_NOT_MEMBER` | Pemanggil bukan anggota workspace |

---

## 12.2 Create Division

### `POST /divisions`

**Authentication:** 🔐 Required

**Permission:** `workspace.manage_divisions`

**Request:**

```json
{
  "workspace_id": "ws_01ABC",
  "name": "IT"
}
```

**Response `201`:**

```json
{
  "success": true,
  "message": "Division berhasil dibuat",
  "data": {
    "id": "div_01ABC",
    "workspace_id": "ws_01ABC",
    "name": "IT",
    "leader": null
  }
}
```

**Error:**

| Status | Code                | Keterangan                                   |
| ------ | ------------------- | -------------------------------------------- |
| `409`  | `RESOURCE_CONFLICT` | Nama division sudah dipakai di workspace ini |

---

## 12.3 Get Division Detail

### `GET /divisions/:id`

**Authentication:** 🔐 Required

**Permission:** `workspace.view`

**Response:**

```json
{
  "success": true,
  "message": "Data division berhasil diambil",
  "data": {
    "id": "div_01ABC",
    "workspace_id": "ws_01ABC",
    "name": "IT",
    "leader": {
      "id": "usr_01ABC",
      "name": "Budi"
    },
    "members": [
      {
        "id": "usr_01ABC",
        "name": "Budi",
        "role": {
          "id": "role_leader",
          "name": "DIVISION_LEADER",
          "is_system": true
        }
      },
      {
        "id": "usr_02ABC",
        "name": "Andi",
        "role": {
          "id": "role_member",
          "name": "MEMBER",
          "is_system": true
        }
      }
    ]
  }
}
```

---

## 12.4 Update Division

### `PUT /divisions/:id`

**Authentication:** 🔐 Required

**Permission:** `workspace.manage_divisions`

**Request:**

```json
{
  "name": "Information Technology"
}
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Division berhasil diperbarui",
  "data": {
    "id": "div_01ABC",
    "workspace_id": "ws_01ABC",
    "name": "Information Technology",
    "leader": {
      "id": "usr_01ABC",
      "name": "Budi"
    }
  }
}
```

---

## 12.5 Delete Division

### `DELETE /divisions/:id`

**Authentication:** 🔐 Required

**Permission:** `workspace.manage_divisions`

Division yang masih memiliki task yang ditugaskan kepadanya tidak dapat langsung dihapus. Task tersebut harus dipindahkan atau dihapus terlebih dahulu.

Jika masih memiliki task:

```json
{
  "success": false,
  "message": "Division masih memiliki task",
  "error": {
    "code": "DIVISION_NOT_EMPTY",
    "details": null
  }
}
```

**Response `204`:**

No response body.

---

## 12.6 Get Division Members

### `GET /divisions/:id/members`

**Authentication:** 🔐 Required

**Permission:** `workspace.view`

**Response:**

```json
{
  "success": true,
  "message": "Anggota division berhasil diambil",
  "data": [
    {
      "id": "usr_01ABC",
      "name": "Budi",
      "role": {
        "id": "role_leader",
        "name": "DIVISION_LEADER",
        "is_system": true
      }
    },
    {
      "id": "usr_02ABC",
      "name": "Andi",
      "role": {
        "id": "role_member",
        "name": "MEMBER",
        "is_system": true
      }
    }
  ]
}
```

---

## 12.7 Set Division Leader

### `PUT /divisions/:id/leader`

**Authentication:** 🔐 Required

**Permission:** `workspace.manage_divisions`

**Request:**

```json
{
  "user_id": "usr_01ABC"
}
```

Backend harus memastikan user tersebut merupakan anggota workspace yang sama.

Menentukan ketua divisi tidak otomatis mengubah role user tersebut. Bila user yang ditunjuk belum memegang role DIVISION_LEADER (atau role kustom yang setara), Owner dapat mengubah role-nya lewat `PUT /workspaces/:id/members/:userId/role` (§8.7).

**Response:**

```json
{
  "success": true,
  "message": "Division leader berhasil diperbarui",
  "data": {
    "division_id": "div_01ABC",
    "leader": {
      "id": "usr_01ABC",
      "name": "Budi"
    }
  }
}
```

---

# 13. Projects API

## 13.1 Get Projects

### `GET /projects`

**Authentication:** 🔐 Required

**Permission:** `project.view`

Query:

```text
?workspace_id=ws_01ABC
&page=1
&limit=10
&search=Absensi
```

`workspace_id` wajib diisi. Hanya project di workspace tersebut yang dikembalikan, dan hanya project yang dapat dilihat pemanggil.

**Response:**

```json
{
  "success": true,
  "message": "Data project berhasil diambil",
  "data": [
    {
      "id": "prj_01ABC",
      "workspace_id": "ws_01ABC",
      "name": "Sistem Absensi",
      "description": "Pengembangan sistem absensi",
      "deadline": "2026-10-30T23:59:59Z",
      "owner_id": "usr_01ABC",
      "industry_id": "ind_software",
      "project_template_id": "ptpl_absensi",
      "taskCount": 10,
      "completedTaskCount": 4
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

**Error:**

| Status | Code               | Keterangan                          |
| ------ | ------------------ | ----------------------------------- |
| `400`  | `VALIDATION_ERROR` | `workspace_id` wajib diisi          |
| `403`  | `WORKSPACE_NOT_MEMBER` | Pemanggil bukan anggota workspace |

---

## 13.2 Create Project

### `POST /projects`

**Authentication:** 🔐 Required

**Permission:** `project.create`

Project dapat dibuat oleh Owner workspace atau Manager yang diundang ke workspace tersebut. Pembuat project otomatis menjadi Owner project tersebut (`owner_id` diisi dengan ID pemanggil).

**Request:**

```json
{
  "workspace_id": "ws_01ABC",
  "name": "Aplikasi Absensi Siswa",
  "description": "Pengembangan aplikasi absensi siswa",
  "deadline": "2026-10-30T23:59:59Z",
  "industry_id": "ind_software",
  "project_template_id": "ptpl_absensi",
  "apply_task_template": true
}
```

* `workspace_id`, `name` wajib diisi.
* `industry_id` bersifat opsional; bila tidak diisi, dipakai bidang usaha workspace.
* `project_template_id` bersifat opsional; diisi bila project dibuat dari saran proyek atau template (§9.3).
* `apply_task_template` bersifat opsional. Bila `project_template_id` diisi dan `apply_task_template` tidak diisi, nilai default adalah `true` — tugas-tugas dari template dibuat otomatis di dalam project. Bila `false`, project dibuat kosong tanpa tugas template. Bila `project_template_id` tidak diisi, `apply_task_template` diabaikan.

**Response `201`:**

```json
{
  "success": true,
  "message": "Project berhasil dibuat",
  "data": {
    "id": "prj_01ABC",
    "workspace_id": "ws_01ABC",
    "name": "Aplikasi Absensi Siswa",
    "description": "Pengembangan aplikasi absensi siswa",
    "deadline": "2026-10-30T23:59:59Z",
    "owner_id": "usr_01ABC",
    "industry_id": "ind_software",
    "project_template_id": "ptpl_absensi",
    "createdTasks": 5
  }
}
```

`createdTasks` berisi jumlah tugas yang dibuat dari template (0 bila template tidak dipakai).

**Error:**

| Status | Code                   | Keterangan                                  |
| ------ | ---------------------- | ------------------------------------------- |
| `404`  | `WORKSPACE_NOT_FOUND`  | `workspace_id` tidak ditemukan              |
| `404`  | `INDUSTRY_NOT_FOUND`   | `industry_id` tidak ditemukan               |
| `404`  | `TEMPLATE_NOT_FOUND`   | `project_template_id` tidak ditemukan       |
| `403`  | `WORKSPACE_NOT_MEMBER` | Pemanggil bukan anggota workspace           |
| `400`  | `VALIDATION_ERROR`     | `name` atau `workspace_id` tidak valid      |

---

## 13.3 Get Project Detail

### `GET /projects/:id`

**Authentication:** 🔐 Required

**Permission:** `project.view`

**Response:**

```json
{
  "success": true,
  "message": "Data project berhasil diambil",
  "data": {
    "id": "prj_01ABC",
    "workspace_id": "ws_01ABC",
    "name": "Sistem Absensi",
    "description": "Pengembangan sistem absensi mahasiswa",
    "deadline": "2026-10-30T23:59:59Z",
    "owner_id": "usr_01ABC",
    "industry_id": "ind_software",
    "project_template_id": "ptpl_absensi",
    "tasks": []
  }
}
```

**Error:**

| Status | Code                | Keterangan                     |
| ------ | ------------------- | ------------------------------ |
| `404`  | `PROJECT_NOT_FOUND` | Project tidak ditemukan        |
| `403`  | `WORKSPACE_NOT_MEMBER` | Pemanggil bukan anggota workspace |

---

## 13.4 Update Project

### `PUT /projects/:id`

**Authentication:** 🔐 Required

**Permission:** `project.update`

**Request:**

```json
{
  "name": "Sistem Absensi Mahasiswa",
  "description": "Updated description",
  "deadline": "2026-11-15T23:59:59Z"
}
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Project berhasil diperbarui",
  "data": {
    "id": "prj_01ABC",
    "workspace_id": "ws_01ABC",
    "name": "Sistem Absensi Mahasiswa",
    "description": "Updated description",
    "deadline": "2026-11-15T23:59:59Z",
    "owner_id": "usr_01ABC"
  }
}
```

---

## 13.5 Delete Project

### `DELETE /projects/:id`

**Authentication:** 🔐 Required

**Permission:** `project.delete`

Project beserta task di dalamnya dapat dihapus menggunakan cascade sesuai aturan database.

**Response `204`:**

No response body.

---

## 13.6 Get Template Tasks Preview

### `GET /projects/templates/:templateId/tasks`

Melihat pratinjau template tugas untuk satu jenis proyek sebelum template dipakai saat membuat project. Pratinjau menampilkan tugas-tugas template beserta subtugasnya.

**Authentication:** 🔐 Required

**Permission:** `workspace.view`

Bila template adalah template kustom milik sebuah workspace, pemanggil harus menjadi anggota workspace tersebut. Bila bukan anggota, endpoint mengembalikan `404 Not Found`.

**Response `200`:**

```json
{
  "success": true,
  "message": "Template tugas berhasil diambil",
  "data": {
    "id": "ptpl_absensi",
    "name": "Aplikasi Absensi Siswa",
    "tasks": [
      {
        "id": "ttpl_01ABC",
        "parent_template_id": null,
        "title": "Analisis kebutuhan",
        "description": "Wawancara pengguna dan penyusunan SRS",
        "priority": "P1",
        "sort_order": 1
      },
      {
        "id": "ttpl_02ABC",
        "parent_template_id": null,
        "title": "Desain UI",
        "description": "Wireframe dan mockup antarmuka",
        "priority": "P2",
        "sort_order": 2
      },
      {
        "id": "ttpl_03ABC",
        "parent_template_id": "ttpl_02ABC",
        "title": "Desain halaman login",
        "description": "Mockup halaman login siswa",
        "priority": "P2",
        "sort_order": 1
      }
    ]
  }
}
```

**Error:**

| Status | Code               | Keterangan                          |
| ------ | ------------------ | ----------------------------------- |
| `404`  | `TEMPLATE_NOT_FOUND` | Template proyek tidak ditemukan   |

---

## 13.7 Get Project Members

### `GET /projects/:id/members`

Melihat anggota proyek beserta role-nya.

**Authentication:** 🔐 Required

**Permission:** `member.view`

**Response `200`:**

```json
{
  "success": true,
  "message": "Anggota proyek berhasil diambil",
  "data": [
    {
      "id": "usr_01ABC",
      "name": "Andi",
      "email": "andi@example.com",
      "role": {
        "id": "role_manager",
        "name": "MANAGER",
        "is_system": true
      }
    }
  ]
}
```

**Error:**

| Status | Code                   | Keterangan                          |
| ------ | ---------------------- | ----------------------------------- |
| `404`  | `PROJECT_NOT_FOUND`    | Project tidak ditemukan             |
| `403`  | `WORKSPACE_NOT_MEMBER` | Pemanggil bukan anggota workspace    |

---

## 13.8 Get Project Templates

### `GET /workspaces/:id/project-templates`

Melihat daftar template proyek yang dapat dipakai di workspace ini: template bawaan sistem untuk bidang usaha apa pun, ditambah template kustom milik workspace ini.

**Authentication:** 🔐 Required

**Permission:** `workspace.view`

**Response `200`:**

```json
{
  "success": true,
  "message": "Template proyek berhasil diambil",
  "data": [
    {
      "id": "ptpl_absensi",
      "industry_id": "ind_software",
      "workspace_id": null,
      "name": "Aplikasi Absensi Siswa",
      "description": "Pengembangan aplikasi absensi siswa",
      "is_system": true
    }
  ]
}
```

**Error:**

| Status | Code                   | Keterangan                          |
| ------ | ---------------------- | ----------------------------------- |
| `404`  | `WORKSPACE_NOT_FOUND`  | Workspace tidak ditemukan           |
| `403`  | `WORKSPACE_NOT_MEMBER` | Pemanggil bukan anggota workspace    |

---

## 13.9 Create Project Template

### `POST /workspaces/:id/project-templates`

Membuat template proyek kustom milik workspace ini (keputusan PRD §13.6: Owner boleh membuat template sendiri).

**Authentication:** 🔐 Required

**Permission:** `workspace.manage_templates`

**Request:**

```json
{
  "name": "Aplikasi Kasir Toko",
  "description": "Pengembangan aplikasi kasir untuk toko retail",
  "industry_id": "ind_retail"
}
```

**Response `201`:**

```json
{
  "success": true,
  "message": "Template proyek berhasil dibuat",
  "data": {
    "id": "ptpl_01ABC",
    "industry_id": "ind_retail",
    "workspace_id": "ws_01ABC",
    "name": "Aplikasi Kasir Toko",
    "description": "Pengembangan aplikasi kasir untuk toko retail",
    "is_system": false
  }
}
```

**Error:**

| Status | Code                   | Keterangan                          |
| ------ | ---------------------- | ----------------------------------- |
| `404`  | `WORKSPACE_NOT_FOUND`  | Workspace tidak ditemukan           |
| `404`  | `INDUSTRY_NOT_FOUND`   | Bidang usaha tidak ditemukan        |
| `403`  | `WORKSPACE_NOT_MEMBER` | Pemanggil bukan anggota workspace    |

---

## 13.10 Get Project Template Detail

### `GET /workspaces/:id/project-templates/:templateId`

Melihat detail satu template proyek beserta daftar template tugasnya.

**Authentication:** 🔐 Required

**Permission:** `workspace.view`

**Response `200`:**

```json
{
  "success": true,
  "message": "Template proyek berhasil diambil",
  "data": {
    "id": "ptpl_absensi",
    "industry_id": "ind_software",
    "workspace_id": null,
    "name": "Aplikasi Absensi Siswa",
    "description": "Pengembangan aplikasi absensi siswa",
    "is_system": true,
    "tasks": [
      {
        "id": "ttpl_01ABC",
        "parent_template_id": null,
        "title": "Analisis kebutuhan",
        "description": "Wawancara pengguna dan penyusunan SRS",
        "priority": "P1",
        "sort_order": 1
      }
    ]
  }
}
```

**Error:**

| Status | Code                   | Keterangan                          |
| ------ | ---------------------- | ----------------------------------- |
| `404`  | `WORKSPACE_NOT_FOUND`  | Workspace tidak ditemukan           |
| `404`  | `TEMPLATE_NOT_FOUND`   | Template proyek tidak ditemukan     |
| `403`  | `WORKSPACE_NOT_MEMBER` | Pemanggil bukan anggota workspace    |

---

## 13.11 Update Project Template

### `PUT /workspaces/:id/project-templates/:templateId`

Mengubah template proyek kustom milik workspace ini. Template bawaan sistem tidak dapat diubah.

**Authentication:** 🔐 Required

**Permission:** `workspace.manage_templates`

**Request:**

```json
{
  "name": "Aplikasi Kasir Toko v2",
  "description": "Pengembangan aplikasi kasir untuk toko retail",
  "industry_id": "ind_retail"
}
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Template proyek berhasil diubah",
  "data": {
    "id": "ptpl_01ABC",
    "industry_id": "ind_retail",
    "workspace_id": "ws_01ABC",
    "name": "Aplikasi Kasir Toko v2",
    "description": "Pengembangan aplikasi kasir untuk toko retail",
    "is_system": false
  }
}
```

**Error:**

| Status | Code                   | Keterangan                                       |
| ------ | ---------------------- | ------------------------------------------------ |
| `404`  | `WORKSPACE_NOT_FOUND`  | Workspace tidak ditemukan                        |
| `404`  | `TEMPLATE_NOT_FOUND`   | Template proyek tidak ditemukan                  |
| `403`  | `WORKSPACE_NOT_MEMBER` | Pemanggil bukan anggota workspace                 |
| `403`  | `FORBIDDEN`            | Template bawaan sistem tidak dapat diubah        |

---

## 13.12 Delete Project Template

### `DELETE /workspaces/:id/project-templates/:templateId`

Menghapus template proyek kustom milik workspace ini beserta seluruh template tugasnya. Template bawaan sistem tidak dapat dihapus. Project yang sudah dibuat dari template ini tidak ikut terhapus; field `project_template_id`-nya menjadi `null`.

**Authentication:** 🔐 Required

**Permission:** `workspace.manage_templates`

**Response `200`:**

```json
{
  "success": true,
  "message": "Template proyek berhasil dihapus",
  "data": null
}
```

**Error:**

| Status | Code                   | Keterangan                                       |
| ------ | ---------------------- | ------------------------------------------------ |
| `404`  | `WORKSPACE_NOT_FOUND`  | Workspace tidak ditemukan                        |
| `404`  | `TEMPLATE_NOT_FOUND`   | Template proyek tidak ditemukan                  |
| `403`  | `WORKSPACE_NOT_MEMBER` | Pemanggil bukan anggota workspace                 |
| `403`  | `FORBIDDEN`            | Template bawaan sistem tidak dapat dihapus       |

---

## 13.13 Get Task Templates

### `GET /workspaces/:id/project-templates/:templateId/tasks`

Melihat daftar template tugas milik satu template proyek.

**Authentication:** 🔐 Required

**Permission:** `workspace.view`

**Response `200`:**

```json
{
  "success": true,
  "message": "Template tugas berhasil diambil",
  "data": [
    {
      "id": "ttpl_01ABC",
      "project_template_id": "ptpl_absensi",
      "parent_template_id": null,
      "title": "Analisis kebutuhan",
      "description": "Wawancara pengguna dan penyusunan SRS",
      "priority": "P1",
      "sort_order": 1
    }
  ]
}
```

**Error:**

| Status | Code                   | Keterangan                          |
| ------ | ---------------------- | ----------------------------------- |
| `404`  | `WORKSPACE_NOT_FOUND`  | Workspace tidak ditemukan           |
| `404`  | `TEMPLATE_NOT_FOUND`   | Template proyek tidak ditemukan     |
| `403`  | `WORKSPACE_NOT_MEMBER` | Pemanggil bukan anggota workspace    |

---

## 13.14 Create Task Template

### `POST /workspaces/:id/project-templates/:templateId/tasks`

Menambah satu template tugas ke sebuah template proyek. `parent_template_id` diisi bila template tugas ini adalah subtugas dari template tugas lain.

**Authentication:** 🔐 Required

**Permission:** `workspace.manage_templates`

**Request:**

```json
{
  "title": "Desain halaman login",
  "description": "Mockup halaman login siswa",
  "priority": "P2",
  "parent_template_id": "ttpl_02ABC",
  "sort_order": 1
}
```

**Response `201`:**

```json
{
  "success": true,
  "message": "Template tugas berhasil dibuat",
  "data": {
    "id": "ttpl_01ABC",
    "project_template_id": "ptpl_absensi",
    "parent_template_id": "ttpl_02ABC",
    "title": "Desain halaman login",
    "description": "Mockup halaman login siswa",
    "priority": "P2",
    "sort_order": 1
  }
}
```

**Error:**

| Status | Code                   | Keterangan                          |
| ------ | ---------------------- | ----------------------------------- |
| `404`  | `WORKSPACE_NOT_FOUND`  | Workspace tidak ditemukan           |
| `404`  | `TEMPLATE_NOT_FOUND`   | Template proyek tidak ditemukan     |
| `404`  | `TASK_TEMPLATE_NOT_FOUND` | Template tugas induk tidak ditemukan |
| `403`  | `WORKSPACE_NOT_MEMBER` | Pemanggil bukan anggota workspace    |
| `403`  | `FORBIDDEN`            | Template bawaan sistem tidak dapat diubah |

---

## 13.15 Update Task Template

### `PUT /workspaces/:id/project-templates/:templateId/tasks/:taskTemplateId`

Mengubah satu template tugas. Template tugas milik template bawaan sistem tidak dapat diubah.

**Authentication:** 🔐 Required

**Permission:** `workspace.manage_templates`

**Request:**

```json
{
  "title": "Desain halaman login",
  "description": "Mockup halaman login siswa dan guru",
  "priority": "P1",
  "parent_template_id": "ttpl_02ABC",
  "sort_order": 1
}
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Template tugas berhasil diubah",
  "data": {
    "id": "ttpl_01ABC",
    "project_template_id": "ptpl_absensi",
    "parent_template_id": "ttpl_02ABC",
    "title": "Desain halaman login",
    "description": "Mockup halaman login siswa dan guru",
    "priority": "P1",
    "sort_order": 1
  }
}
```

**Error:**

| Status | Code                      | Keterangan                          |
| ------ | ------------------------- | ----------------------------------- |
| `404`  | `WORKSPACE_NOT_FOUND`     | Workspace tidak ditemukan           |
| `404`  | `TEMPLATE_NOT_FOUND`      | Template proyek tidak ditemukan     |
| `404`  | `TASK_TEMPLATE_NOT_FOUND` | Template tugas tidak ditemukan      |
| `403`  | `WORKSPACE_NOT_MEMBER`    | Pemanggil bukan anggota workspace    |
| `403`  | `FORBIDDEN`               | Template bawaan sistem tidak dapat diubah |

---

## 13.16 Delete Task Template

### `DELETE /workspaces/:id/project-templates/:templateId/tasks/:taskTemplateId`

Menghapus satu template tugas. Subtugas template di bawahnya ikut terhapus. Template tugas milik template bawaan sistem tidak dapat dihapus.

**Authentication:** 🔐 Required

**Permission:** `workspace.manage_templates`

**Response `200`:**

```json
{
  "success": true,
  "message": "Template tugas berhasil dihapus",
  "data": null
}
```

**Error:**

| Status | Code                      | Keterangan                          |
| ------ | ------------------------- | ----------------------------------- |
| `404`  | `WORKSPACE_NOT_FOUND`     | Workspace tidak ditemukan           |
| `404`  | `TEMPLATE_NOT_FOUND`      | Template proyek tidak ditemukan     |
| `404`  | `TASK_TEMPLATE_NOT_FOUND` | Template tugas tidak ditemukan      |
| `403`  | `WORKSPACE_NOT_MEMBER`    | Pemanggil bukan anggota workspace    |
| `403`  | `FORBIDDEN`               | Template bawaan sistem tidak dapat dihapus |

---

# 14. Tasks API

Task merupakan resource utama dalam sistem.

## 14.1 Get Tasks

### `GET /tasks`

**Authentication:** 🔐 Required

**Permission:** `task.view`

Backend secara otomatis melakukan filtering berdasarkan izin dan scope pemanggil.

### Query Parameters

```text
?workspace_id=ws_01ABC
&page=1
&limit=10
&search=backend
&status=IN_PROGRESS
&priority=P1
&project_id=prj_01ABC
&division_id=div_01ABC
&assignee_id=usr_01ABC
&sort=deadline
&order=asc
```

`workspace_id` wajib diisi. Hanya task di workspace tersebut yang dikembalikan.

### Scope

`OWNER` dan `MANAGER` dapat melihat task sesuai kewenangannya di workspace tersebut.

`DIVISION_LEADER` hanya melihat task:

* yang diberikan kepada dirinya;
* yang diberikan kepada division-nya;
* subtask yang berada di bawah kewenangannya.

`MEMBER` hanya melihat task yang diberikan kepadanya.

**Response:**

```json
{
  "success": true,
  "message": "Data task berhasil diambil",
  "data": [
    {
      "id": "tsk_01ABC",
      "workspace_id": "ws_01ABC",
      "title": "Membuat API Login",
      "status": "IN_PROGRESS",
      "priority": "P1",
      "deadline": "2026-10-01T23:59:59Z",
      "project": {
        "id": "prj_01ABC",
        "name": "Sistem Absensi"
      },
      "division": {
        "id": "div_01ABC",
        "name": "IT"
      },
      "assignee": {
        "id": "usr_01ABC",
        "name": "Andi"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

**Error:**

| Status | Code               | Keterangan                          |
| ------ | ------------------ | ----------------------------------- |
| `400`  | `VALIDATION_ERROR` | `workspace_id` wajib diisi          |
| `403`  | `WORKSPACE_NOT_MEMBER` | Pemanggil bukan anggota workspace |

---

## 14.2 Create Task

### `POST /tasks`

**Authentication:** 🔐 Required

**Permission:** `task.create`

## Request — assign to member

```json
{
  "workspace_id": "ws_01ABC",
  "project_id": "prj_01ABC",
  "title": "Membuat API Login",
  "description": "Membuat endpoint authentication",
  "priority": "P1",
  "deadline": "2026-10-01T23:59:59Z",
  "assignee_id": "usr_02ABC"
}
```

## Request — assign to division

```json
{
  "workspace_id": "ws_01ABC",
  "project_id": "prj_01ABC",
  "title": "Mengerjakan Backend",
  "description": "Membangun backend aplikasi",
  "priority": "P1",
  "deadline": "2026-10-10T23:59:59Z",
  "division_id": "div_01ABC"
}
```

## Request — create subtask

```json
{
  "workspace_id": "ws_01ABC",
  "project_id": "prj_01ABC",
  "parent_task_id": "tsk_01ABC",
  "title": "Membuat endpoint login",
  "description": "Implementasi endpoint POST /auth/login",
  "priority": "P1",
  "deadline": "2026-10-01T23:59:59Z",
  "assignee_id": "usr_02ABC"
}
```

`workspace_id` dan `project_id` wajib diisi. `project_id` harus berada di workspace yang sama dengan `workspace_id`. Subtask dibuat dengan mengisi `parent_task_id`; parent task harus berada di project yang sama.

**Response `201`:**

```json
{
  "success": true,
  "message": "Task berhasil dibuat",
  "data": {
    "id": "tsk_02ABC",
    "workspace_id": "ws_01ABC",
    "title": "Membuat endpoint login",
    "status": "ASSIGNED",
    "priority": "P1"
  }
}
```

**Error:**

| Status | Code                | Keterangan                                  |
| ------ | ------------------- | ------------------------------------------- |
| `404`  | `PROJECT_NOT_FOUND` | Project tidak ditemukan                     |
| `404`  | `TASK_NOT_FOUND`    | Parent task tidak ditemukan                 |
| `403`  | `WORKSPACE_NOT_MEMBER` | Pemanggil bukan anggota workspace        |
| `400`  | `VALIDATION_ERROR`  | Data task tidak valid                       |

---

## 14.3 Get Task Detail

### `GET /tasks/:id`

**Authentication:** 🔐 Required

**Permission:** `task.view` (sesuai task scope)

**Response:**

```json
{
  "success": true,
  "message": "Data task berhasil diambil",
  "data": {
    "id": "tsk_01ABC",
    "workspace_id": "ws_01ABC",
    "title": "Membuat API Login",
    "description": "Membuat endpoint authentication",
    "status": "IN_PROGRESS",
    "priority": "P1",
    "deadline": "2026-10-01T23:59:59Z",
    "project": {
      "id": "prj_01ABC",
      "name": "Sistem Absensi"
    },
    "division": {
      "id": "div_01ABC",
      "name": "IT"
    },
    "assignee": {
      "id": "usr_02ABC",
      "name": "Andi"
    },
    "parentTask": null
  }
}
```

**Error:**

| Status | Code               | Keterangan                         |
| ------ | ------------------ | ---------------------------------- |
| `404`  | `TASK_NOT_FOUND`   | Task tidak ditemukan               |
| `403`  | `TASK_ACCESS_DENIED` | Pemanggil tidak memiliki akses ke task ini |

---

## 14.4 Update Task

### `PUT /tasks/:id`

**Authentication:** 🔐 Required

**Permission:** `task.update` (sesuai task scope)

`MEMBER` tidak menggunakan endpoint ini untuk mengubah informasi task.

**Request:**

```json
{
  "title": "Membuat REST API Login",
  "description": "Updated description",
  "priority": "P2",
  "deadline": "2026-10-05T23:59:59Z"
}
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Task berhasil diperbarui",
  "data": {
    "id": "tsk_01ABC",
    "workspace_id": "ws_01ABC",
    "title": "Membuat REST API Login",
    "status": "IN_PROGRESS",
    "priority": "P2"
  }
}
```

---

## 14.5 Delete Task

### `DELETE /tasks/:id`

**Authentication:** 🔐 Required

**Permission:** `task.delete` (sesuai task scope)

Subtask akan ikut terhapus apabila menggunakan cascade sesuai konfigurasi database.

**Response `204`:**

No response body.

---

## 14.6 Update Task Status

### `PUT /tasks/:id/status`

**Authentication:** 🔐 Required

**Permission:** `task.update_status` (sesuai task scope)

**Request:**

```json
{
  "status": "IN_PROGRESS"
}
```

Status yang tersedia:

```text
BACKLOG
ASSIGNED
IN_PROGRESS
REVIEW
COMPLETED
BLOCKED
CANCELLED
```

Contoh alur utama:

```text
ASSIGNED
   ↓
IN_PROGRESS
   ↓
REVIEW
   ↓
COMPLETED
```

Jika perlu revisi:

```text
REVIEW
   ↓
IN_PROGRESS
   ↓
REVIEW
```

**Response:**

```json
{
  "success": true,
  "message": "Status task berhasil diperbarui",
  "data": {
    "id": "tsk_01ABC",
    "status": "IN_PROGRESS"
  }
}
```

Setiap perubahan status wajib dicatat ke `task_history`.

**Error:**

| Status | Code                | Keterangan                  |
| ------ | ------------------- | --------------------------- |
| `400`  | `INVALID_TASK_STATUS` | Status task tidak valid   |

---

## 14.7 Delegate Task

### `POST /tasks/:id/delegate`

Digunakan untuk memberikan task atau membuat delegasi kepada user/division.

**Authentication:** 🔐 Required

**Permission:** `task.delegate` (sesuai task scope)

## Delegate ke user

```json
{
  "assignee_id": "usr_02ABC"
}
```

## Delegate ke division

```json
{
  "division_id": "div_01ABC"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Task berhasil didelegasikan",
  "data": {
    "id": "tsk_01ABC",
    "division": {
      "id": "div_01ABC",
      "name": "IT"
    },
    "assignee": null
  }
}
```

Backend wajib memvalidasi bahwa `DIVISION_LEADER` hanya dapat mendelegasikan task kepada anggota divisinya, dan bahwa user atau division yang dituju berada di workspace yang sama dengan task tersebut.

**Error:**

| Status | Code               | Keterangan                        |
| ------ | ------------------ | --------------------------------- |
| `400`  | `INVALID_DELEGATION` | Delegasi tidak diperbolehkan    |

---

## 14.8 Get Subtasks

### `GET /tasks/:id/subtasks`

**Authentication:** 🔐 Required

**Permission:** `task.view` (sesuai task scope)

**Response:**

```json
{
  "success": true,
  "message": "Subtask berhasil diambil",
  "data": [
    {
      "id": "tsk_02ABC",
      "title": "Membuat API Login",
      "status": "COMPLETED",
      "assignee": {
        "id": "usr_02ABC",
        "name": "Andi"
      }
    },
    {
      "id": "tsk_03ABC",
      "title": "Membuat API Register",
      "status": "IN_PROGRESS",
      "assignee": {
        "id": "usr_03ABC",
        "name": "Sinta"
      }
    }
  ]
}
```

---

# 15. Task History API

## 15.1 Get Task History

### `GET /tasks/:id/history`

**Authentication:** 🔐 Required

**Permission:** `history.view` (sesuai task scope)

**Response:**

```json
{
  "success": true,
  "message": "History task berhasil diambil",
  "data": [
    {
      "id": "hst_01ABC",
      "action": "STATUS_CHANGED",
      "oldStatus": "ASSIGNED",
      "newStatus": "IN_PROGRESS",
      "description": null,
      "user": {
        "id": "usr_02ABC",
        "name": "Andi"
      },
      "createdAt": "2026-09-27T10:00:00Z"
    }
  ]
}
```

Jenis `action` yang direkomendasikan:

```text
CREATED
UPDATED
DELEGATED
STATUS_CHANGED
ATTACHMENT_ADDED
ATTACHMENT_DELETED
COMMENT_ADDED
COMMENT_DELETED
```

---

# 16. Task Attachments API

## 16.1 Upload Attachment

### `POST /tasks/:id/attachments`

**Authentication:** 🔐 Required

**Permission:** `attachment.upload` (sesuai task scope)

Endpoint menggunakan:

```http
Content-Type: multipart/form-data
```

Field:

```text
file: <binary>
```

Backend:

1. menerima file;
2. melakukan validasi tipe dan ukuran;
3. upload file ke Supabase Storage;
4. menyimpan metadata ke `task_attachments`.

**Response:**

```json
{
  "success": true,
  "message": "Attachment berhasil diupload",
  "data": {
    "id": "att_01ABC",
    "fileName": "api-documentation.pdf",
    "fileType": "application/pdf",
    "fileSize": 245760,
    "fileUrl": "https://storage.example.com/..."
  }
}
```

**Error:**

| Status | Code                    | Keterangan                   |
| ------ | ----------------------- | ---------------------------- |
| `400`  | `FILE_TOO_LARGE`        | Ukuran file terlalu besar    |
| `400`  | `UNSUPPORTED_FILE_TYPE` | Tipe file tidak didukung     |

---

## 16.2 Get Attachments

### `GET /tasks/:id/attachments`

**Authentication:** 🔐 Required

**Permission:** `task.view` (sesuai task scope)

**Response:**

```json
{
  "success": true,
  "message": "Attachment berhasil diambil",
  "data": [
    {
      "id": "att_01ABC",
      "fileName": "api-documentation.pdf",
      "fileType": "application/pdf",
      "fileSize": 245760,
      "fileUrl": "https://storage.example.com/..."
    }
  ]
}
```

---

## 16.3 Delete Attachment

### `DELETE /tasks/:taskId/attachments/:attachmentId`

**Authentication:** 🔐 Required

**Permission:** `attachment.delete` (sesuai task scope)

**Response:**

```json
{
  "success": true,
  "message": "Attachment berhasil dihapus",
  "data": null
}
```

**Error:**

| Status | Code                 | Keterangan                   |
| ------ | -------------------- | ---------------------------- |
| `404`  | `ATTACHMENT_NOT_FOUND` | Attachment tidak ditemukan |

---

# 17. Task Comments API

Komentar memungkinkan anggota proyek berdiskusi pada sebuah task.

## 17.1 Create Comment

### `POST /tasks/:id/comments`

**Authentication:** 🔐 Required

**Permission:** `comment.create` (sesuai task scope)

**Request:**

```json
{
  "content": "Endpoint login sudah selesai, mohon direview."
}
```

**Response `201`:**

```json
{
  "success": true,
  "message": "Komentar berhasil ditambahkan",
  "data": {
    "id": "cmt_01ABC",
    "task_id": "tsk_01ABC",
    "content": "Endpoint login sudah selesai, mohon direview.",
    "user": {
      "id": "usr_02ABC",
      "name": "Andi"
    },
    "created_at": "2026-11-13T10:00:00Z",
    "updated_at": "2026-11-13T10:00:00Z"
  }
}
```

Menambah komentar dicatat ke `task_history` dengan action `COMMENT_ADDED`.

**Error:**

| Status | Code               | Keterangan                         |
| ------ | ------------------ | ---------------------------------- |
| `404`  | `TASK_NOT_FOUND`   | Task tidak ditemukan               |
| `403`  | `TASK_ACCESS_DENIED` | Pemanggil tidak memiliki akses ke task ini |
| `400`  | `VALIDATION_ERROR` | `content` wajib diisi              |

---

## 17.2 Get Comments

### `GET /tasks/:id/comments`

**Authentication:** 🔐 Required

**Permission:** `task.view` (sesuai task scope)

Query:

```text
?page=1
&limit=10
```

Komentar diurutkan dari yang terlama ke terbaru.

**Response `200`:**

```json
{
  "success": true,
  "message": "Komentar berhasil diambil",
  "data": [
    {
      "id": "cmt_01ABC",
      "task_id": "tsk_01ABC",
      "content": "Endpoint login sudah selesai, mohon direview.",
      "user": {
        "id": "usr_02ABC",
        "name": "Andi"
      },
      "created_at": "2026-11-13T10:00:00Z",
      "updated_at": "2026-11-13T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## 17.3 Delete Comment

### `DELETE /tasks/:taskId/comments/:commentId`

Menghapus komentar. Komentar dapat dihapus oleh penulis komentar itu sendiri, atau oleh pengguna yang memiliki izin `task.delete` atas task tersebut.

**Authentication:** 🔐 Required

**Permission:** `task.delete` (sesuai task scope) atau penulis komentar

**Response `200`:**

```json
{
  "success": true,
  "message": "Komentar berhasil dihapus",
  "data": null
}
```

Menghapus komentar dicatat ke `task_history` dengan action `COMMENT_DELETED`.

**Error:**

| Status | Code                | Keterangan                      |
| ------ | ------------------- | ------------------------------- |
| `404`  | `COMMENT_NOT_FOUND` | Komentar tidak ditemukan        |
| `403`  | `FORBIDDEN`         | Pemanggil bukan penulis komentar dan tidak memiliki `task.delete` |

---

# 18. Dashboard API

Dashboard menggunakan endpoint khusus agar frontend tidak perlu melakukan banyak request untuk menghitung statistik. Semua statistik dibatasi pada workspace aktif.

## 18.1 Dashboard Summary

### `GET /dashboard/summary`

**Authentication:** 🔐 Required

**Permission:** `dashboard.view`

Query:

```text
?workspace_id=ws_01ABC
```

`workspace_id` wajib diisi. Response disesuaikan dengan izin dan scope pemanggil: anggota hanya melihat statistik task dalam kewenangannya.

**Response:**

```json
{
  "success": true,
  "message": "Dashboard berhasil diambil",
  "data": {
    "workspace_id": "ws_01ABC",
    "totalTasks": 25,
    "completedTasks": 10,
    "inProgressTasks": 8,
    "reviewTasks": 3,
    "overdueTasks": 4,
    "completionRate": 40
  }
}
```

**Error:**

| Status | Code               | Keterangan                          |
| ------ | ------------------ | ----------------------------------- |
| `400`  | `VALIDATION_ERROR` | `workspace_id` wajib diisi          |
| `403`  | `WORKSPACE_NOT_MEMBER` | Pemanggil bukan anggota workspace |

---

## 18.2 Dashboard Task Statistics

### `GET /dashboard/tasks`

**Authentication:** 🔐 Required

**Permission:** `analytics.view`

Query:

```text
?workspace_id=ws_01ABC
&project_id=prj_01ABC
&division_id=div_01ABC
```

`workspace_id` wajib diisi. `project_id` dan `division_id` bersifat opsional untuk mempersempit statistik.

**Response:**

```json
{
  "success": true,
  "message": "Statistik task berhasil diambil",
  "data": {
    "workspace_id": "ws_01ABC",
    "byStatus": {
      "BACKLOG": 2,
      "ASSIGNED": 5,
      "IN_PROGRESS": 8,
      "REVIEW": 3,
      "COMPLETED": 10,
      "BLOCKED": 1,
      "CANCELLED": 0
    },
    "byPriority": {
      "P1": 5,
      "P2": 10,
      "P3": 14
    }
  }
}
```

---

# 19. Search, Filtering & Pagination

Endpoint collection mendukung pagination:

```text
?page=1&limit=10
```

Default:

```text
page = 1
limit = 10
```

Maksimum:

```text
limit = 100
```

Search:

```text
?search=backend
```

Filter:

```text
?workspace_id=ws_01ABC
&status=IN_PROGRESS
&priority=P1
&division_id=div_01ABC
&assignee_id=usr_01ABC
&project_id=prj_01ABC
```

Sorting:

```text
?sort=deadline&order=asc
```

Semua daftar dibatasi pada workspace aktif. `workspace_id` wajib diisi pada endpoint daftar (`GET /tasks`, `GET /projects`, `GET /divisions`, `GET /dashboard/summary`, `GET /dashboard/tasks`). Tanpa `workspace_id`, backend mengembalikan `400 Bad Request` (`VALIDATION_ERROR`).

Response:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 35,
    "totalPages": 4
  }
}
```

---

# 20. Error Codes

| Code                      | Keterangan                                |
| ------------------------- | ----------------------------------------- |
| `VALIDATION_ERROR`        | Data tidak valid                          |
| `INVALID_CREDENTIALS`     | Email/password salah                      |
| `GOOGLE_AUTH_FAILED`      | Token Google tidak valid                  |
| `UNAUTHORIZED`            | Authentication diperlukan                 |
| `FORBIDDEN`               | Tidak memiliki permission                 |
| `USER_NOT_FOUND`          | User tidak ditemukan                      |
| `ROLE_NOT_FOUND`          | Role tidak ditemukan                      |
| `ROLE_IN_USE`             | Role masih dipakai anggota atau undangan pending |
| `ROLE_SYSTEM_PROTECTED`   | Role bawaan sistem tidak dapat diubah atau dihapus |
| `ROLE_NOT_IN_WORKSPACE`   | Role kustom bukan milik workspace ini     |
| `WORKSPACE_NOT_FOUND`     | Workspace tidak ditemukan                 |
| `WORKSPACE_LIMIT_REACHED` | User sudah memiliki satu workspace        |
| `WORKSPACE_NOT_MEMBER`    | Pemanggil bukan anggota workspace         |
| `INDUSTRY_NOT_FOUND`      | Bidang usaha tidak ditemukan              |
| `TEMPLATE_NOT_FOUND`      | Template proyek tidak ditemukan           |
| `TASK_TEMPLATE_NOT_FOUND` | Template tugas tidak ditemukan            |
| `DIVISION_NOT_FOUND`      | Division tidak ditemukan                  |
| `DIVISION_NOT_EMPTY`      | Division masih memiliki task              |
| `PROJECT_NOT_FOUND`       | Project tidak ditemukan                   |
| `TASK_NOT_FOUND`          | Task tidak ditemukan                      |
| `TASK_ACCESS_DENIED`      | Tidak memiliki akses ke task              |
| `INVALID_TASK_STATUS`     | Status task tidak valid                   |
| `INVALID_DELEGATION`      | Delegasi tidak diperbolehkan              |
| `ATTACHMENT_NOT_FOUND`    | Attachment tidak ditemukan                |
| `COMMENT_NOT_FOUND`       | Komentar tidak ditemukan                  |
| `FILE_TOO_LARGE`          | Ukuran file terlalu besar                 |
| `UNSUPPORTED_FILE_TYPE`   | Tipe file tidak didukung                  |
| `EMAIL_ALREADY_EXISTS`    | Email sudah digunakan                     |
| `INVITATION_INVALID`      | Token atau undangan tidak ditemukan       |
| `INVITATION_EXPIRED`      | Undangan sudah kedaluwarsa                |
| `RESOURCE_CONFLICT`       | Terjadi konflik resource                  |
| `INTERNAL_SERVER_ERROR`   | Kesalahan internal server                 |

---

# 21. Resource Relationship

Relasi utama API:

```text
User
 │
 ├── Workspace Memberships
 │      │
 │      ├── Workspace (Owner / anggota)
 │      │      │
 │      │      ├── Divisions
 │      │      │      └── Leader
 │      │      │
 │      │      └── Projects
 │      │             │
 │      │             └── Tasks
 │      │                    │
 │      │                    ├── Parent Task
 │      │                    │      └── Subtasks
 │      │                    │
 │      │                    ├── Assignee
 │      │                    │
 │      │                    ├── Division
 │      │                    │
 │      │                    ├── History
 │      │                    │
 │      │                    ├── Attachments
 │      │                    │
 │      │                    └── Comments
 │      │
 │      └── Role (workspace_roles)
 │             │
 │             └── Permissions (role_permissions)
 │
 └── Invitations (diundang ke Workspace / Project)

Industry
 │
 └── Project Templates
        │
        └── Task Templates
               │
               └── Subtask Templates
```

---

# 22. Main Business Flow

## Alur Utama (Pengguna Baru)

```text
Buka Web
  ↓
Register (email + password) atau Login dengan Google
  ↓
Buat Workspace + Pilih Bidang Usaha
  ↓
Buat Project (dari saran proyek sesuai bidang, atau nama sendiri)
  ↓
Pakai Template Tugas (opsional)
  ↓
Undang Manager / Ketua Divisi
  ↓
Ketua Divisi Undang Anggota + Pecah Tugas menjadi Subtugas
  ↓
Anggota Mengerjakan Tugas (status, lampiran, komentar)
  ↓
Monitor Progres di Dashboard
```

## Owner Workspace

```text
Register / Login
  ↓
Buat Workspace (maks. 1)
  ↓
Pilih Bidang Usaha
  ↓
Buat Project (otomatis menjadi Owner project)
  ↓
Undang Manager / Ketua Divisi
  ↓
Kelola Divisi, Anggota, Role, dan Template
  ↓
Monitor Progress
```

## Manager

```text
Terima Undangan (atau Login sebagai Owner)
  ↓
Dashboard
  ↓
Create Project
  ↓
Create Task
  ↓
Assign to Division / Member
  ↓
Monitor Progress
  ↓
Review
  ↓
Completed
```

## Division Leader

```text
Login
  ↓
Dashboard
  ↓
Melihat Task Division
  ↓
Membuat Subtask
  ↓
Assign ke Member
  ↓
Undang Anggota ke Divisi
  ↓
Monitor
  ↓
Review
  ↓
Completed
```

## Member

```text
Login
  ↓
Dashboard / My Tasks
  ↓
Melihat Task
  ↓
In Progress
  ↓
Upload Attachment
  ↓
Komentar
  ↓
Submit for Review
  ↓
Completed
```

---

# 23. API Endpoint Summary

| Method | Endpoint                                   | Auth | Permission                   |
| ------ | ------------------------------------------ | ---- | ---------------------------- |
| POST   | `/auth/register`                           | ❌    | Public                       |
| POST   | `/auth/login`                              | ❌    | Public                       |
| POST   | `/auth/logout`                             | ✅    | Login                        |
| GET    | `/auth/me`                                 | ✅    | Login                        |
| POST   | `/auth/google`                             | ❌    | Public                       |
| GET    | `/users/:id`                               | ✅    | `member.view`                |
| POST   | `/workspaces`                              | ✅    | Login                        |
| GET    | `/workspaces`                              | ✅    | Login                        |
| GET    | `/workspaces/:id`                          | ✅    | `workspace.view`             |
| PUT    | `/workspaces/:id`                          | ✅    | `workspace.update`           |
| DELETE | `/workspaces/:id`                          | ✅    | `workspace.delete`           |
| GET    | `/workspaces/:id/members`                  | ✅    | `member.view`                |
| PUT    | `/workspaces/:id/members/:userId/role`     | ✅    | `member.manage`              |
| DELETE | `/workspaces/:id/members/:userId`          | ✅    | `member.manage`              |
| GET    | `/industries`                              | ✅    | Login                        |
| POST   | `/industries`                              | ✅    | `workspace.manage_industries` |
| GET    | `/industries/:id/project-suggestions`      | ✅    | Login                        |
| GET    | `/permissions`                             | ✅    | Login                        |
| GET    | `/workspaces/:id/roles`                    | ✅    | `member.view`                |
| POST   | `/workspaces/:id/roles`                    | ✅    | `member.manage`              |
| GET    | `/workspaces/:id/roles/:roleId`            | ✅    | `member.view`                |
| PUT    | `/workspaces/:id/roles/:roleId`            | ✅    | `member.manage`              |
| DELETE | `/workspaces/:id/roles/:roleId`            | ✅    | `member.manage`              |
| POST   | `/workspaces/:id/invitations`              | ✅    | `member.invite`              |
| GET    | `/workspaces/:id/invitations`              | ✅    | `member.view`                |
| POST   | `/invitations/:token/accept`               | ✅    | Login                        |
| POST   | `/invitations/:token/decline`              | ✅    | Login                        |
| POST   | `/invitations/:id/resend`                  | ✅    | `member.invite`              |
| GET    | `/divisions`                               | ✅    | `workspace.view`             |
| POST   | `/divisions`                               | ✅    | `workspace.manage_divisions` |
| GET    | `/divisions/:id`                           | ✅    | `workspace.view`             |
| PUT    | `/divisions/:id`                           | ✅    | `workspace.manage_divisions` |
| DELETE | `/divisions/:id`                           | ✅    | `workspace.manage_divisions` |
| GET    | `/divisions/:id/members`                   | ✅    | `workspace.view`             |
| PUT    | `/divisions/:id/leader`                    | ✅    | `workspace.manage_divisions` |
| GET    | `/projects`                                | ✅    | `project.view`               |
| POST   | `/projects`                                | ✅    | `project.create`             |
| GET    | `/projects/:id`                            | ✅    | `project.view`               |
| PUT    | `/projects/:id`                            | ✅    | `project.update`             |
| DELETE | `/projects/:id`                            | ✅    | `project.delete`             |
| GET    | `/projects/templates/:templateId/tasks`    | ✅    | `workspace.view`             |
| GET    | `/projects/:id/members`                    | ✅    | `member.view`                |
| GET    | `/workspaces/:id/project-templates`        | ✅    | `workspace.view`             |
| POST   | `/workspaces/:id/project-templates`        | ✅    | `workspace.manage_templates` |
| GET    | `/workspaces/:id/project-templates/:templateId` | ✅    | `workspace.view`             |
| PUT    | `/workspaces/:id/project-templates/:templateId` | ✅    | `workspace.manage_templates` |
| DELETE | `/workspaces/:id/project-templates/:templateId` | ✅    | `workspace.manage_templates` |
| GET    | `/workspaces/:id/project-templates/:templateId/tasks` | ✅    | `workspace.view`             |
| POST   | `/workspaces/:id/project-templates/:templateId/tasks` | ✅    | `workspace.manage_templates` |
| PUT    | `/workspaces/:id/project-templates/:templateId/tasks/:taskTemplateId` | ✅    | `workspace.manage_templates` |
| DELETE | `/workspaces/:id/project-templates/:templateId/tasks/:taskTemplateId` | ✅    | `workspace.manage_templates` |
| GET    | `/tasks`                                   | ✅    | `task.view`                  |
| POST   | `/tasks`                                   | ✅    | `task.create`                |
| GET    | `/tasks/:id`                               | ✅    | `task.view`                  |
| PUT    | `/tasks/:id`                               | ✅    | `task.update`                |
| DELETE | `/tasks/:id`                               | ✅    | `task.delete`                |
| PUT    | `/tasks/:id/status`                        | ✅    | `task.update_status`         |
| POST   | `/tasks/:id/delegate`                      | ✅    | `task.delegate`              |
| GET    | `/tasks/:id/subtasks`                      | ✅    | `task.view`                  |
| GET    | `/tasks/:id/history`                       | ✅    | `history.view`               |
| POST   | `/tasks/:id/attachments`                   | ✅    | `attachment.upload`          |
| GET    | `/tasks/:id/attachments`                   | ✅    | `task.view`                  |
| DELETE | `/tasks/:taskId/attachments/:attachmentId` | ✅    | `attachment.delete`          |
| POST   | `/tasks/:id/comments`                      | ✅    | `comment.create`             |
| GET    | `/tasks/:id/comments`                      | ✅    | `task.view`                  |
| DELETE | `/tasks/:taskId/comments/:commentId`       | ✅    | `task.delete` *              |
| GET    | `/dashboard/summary`                       | ✅    | `dashboard.view`             |
| GET    | `/dashboard/tasks`                         | ✅    | `analytics.view`             |

`*` `DELETE /tasks/:taskId/comments/:commentId` dapat dilakukan oleh pemilik komentar atau pengguna dengan izin `task.delete` (§17.3).

Keterangan kolom Permission:

* `Public` — tidak butuh authentication.
* `Login` — butuh authentication (JWT), tanpa izin khusus.
* Nama izin — butuh authentication dan izin tersebut di workspace yang bersangkutan.
