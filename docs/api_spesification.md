# API Specification — Task Management System

**Version:** 1.0.0
**Base Path:** `/api/v1`
**Authentication:** JWT Bearer Token
**Content-Type:** `application/json`

---

# 1. Overview

Task Management System merupakan aplikasi manajemen project dan task dengan fitur:

* Authentication dan JWT
* Role-Based Access Control (RBAC)
* Project management
* Task management
* Delegasi tugas berjenjang
* Manajemen divisi
* Task history
* Task attachment
* Search, filtering, dan pagination
* Dashboard analytics

API menggunakan REST architecture dengan format JSON.

---

# 2. Role & Permission

Sistem memiliki empat role utama:

| Role              | Deskripsi                                     |
| ----------------- | --------------------------------------------- |
| `ADMIN`           | Mengelola user, role, dan struktur organisasi |
| `MANAGER`         | Mengelola project dan task tingkat organisasi |
| `DIVISION_LEADER` | Mengelola task dan anggota dalam divisinya    |
| `MEMBER`          | Mengerjakan task yang diberikan kepadanya     |

## 2.1 Permission Matrix

| Resource / Action          | ADMIN | MANAGER | DIVISION_LEADER | MEMBER |
| -------------------------- | :---: | :-----: | :-------------: | :----: |
| Melihat dashboard          |   ✅   |    ✅    |        ✅        |    ✅   |
| Melihat user               |   ✅   |    ✅    |       👁️       |   👁️  |
| Membuat user               |   ✅   |    ❌    |        ❌        |    ❌   |
| Mengubah user              |   ✅   |    ❌    |        ❌        |    ❌   |
| Menghapus user             |   ✅   |    ❌    |        ❌        |    ❌   |
| Melihat role               |   ✅   |   👁️   |       👁️       |   👁️  |
| Membuat division           |   ✅   |    ❌    |        ❌        |    ❌   |
| Mengubah division          |   ✅   |    ❌    |        ❌        |    ❌   |
| Menghapus division         |   ✅   |    ❌    |        ❌        |    ❌   |
| Mengelola anggota division |   ✅   |    ❌    |        ✅        |    ❌   |
| Menentukan division leader |   ✅   |    ❌    |        ❌        |    ❌   |
| Membuat project            |   ❌   |    ✅    |        ❌        |    ❌   |
| Mengubah project           |   ❌   |    ✅    |        ❌        |    ❌   |
| Menghapus project          |   ❌   |    ✅    |        ❌        |    ❌   |
| Melihat project            |   ✅   |    ✅    |        ✅        |    ✅   |
| Membuat task               |   ❌   |    ✅    |        ✅        |    ❌   |
| Mengubah task              |   ❌   |    ✅    |        ✅*       |    ❌   |
| Menghapus task             |   ❌   |    ✅    |        ✅*       |    ❌   |
| Delegasi task              |   ❌   |    ✅    |        ✅*       |    ❌   |
| Update status task         |   ❌   |    ✅    |        ✅*       |   ✅*   |
| Melihat task history       |   ✅   |    ✅    |        ✅        |   👁️  |
| Upload attachment          |   ❌   |    ✅    |        ✅        |   ✅*   |
| Menghapus attachment       |   ❌   |    ✅    |        ✅*       |    ❌   |
| Analytics                  |   ✅   |    ✅    |        ✅        |   👁️  |

`*` hanya berlaku untuk task yang berada dalam kewenangan user tersebut.

### Aturan kewenangan task

`MANAGER`:

* dapat mengelola seluruh task dalam project yang dikelolanya;
* dapat memberikan task langsung kepada user;
* dapat memberikan task kepada division;
* dapat melakukan delegasi tingkat organisasi.

`DIVISION_LEADER`:

* dapat melihat task yang diberikan kepada divisinya;
* dapat membuat subtask dari task yang menjadi kewenangannya;
* dapat mendelegasikan subtask kepada anggota divisinya;
* tidak dapat mengubah atau menghapus task milik division lain;
* tidak dapat mengubah struktur project.

`MEMBER`:

* hanya dapat melihat task yang diberikan kepadanya;
* dapat memperbarui status task miliknya;
* dapat mengunggah attachment pada task miliknya;
* tidak dapat menghapus task;
* tidak dapat mendelegasikan task.

---

# 3. Authentication

Semua endpoint yang membutuhkan authentication menggunakan:

```http
Authorization: Bearer <JWT_TOKEN>
```

Contoh:

```http
GET /api/v1/tasks
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

JWT minimal menyimpan:

```json
{
  "sub": "usr_01ABC",
  "role": "MEMBER",
  "iat": 1780000000,
  "exp": 1780003600
}
```

`sub` berisi ID user.

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

Role default:

```text
MEMBER
```

User tidak dapat menentukan role melalui endpoint register.

**Response `201`:**

```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": {
    "id": "usr_01ABC",
    "name": "Andi",
    "email": "andi@example.com",
    "role": "MEMBER"
  }
}
```

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
      "role": "MEMBER",
      "division": {
        "id": "div_01ABC",
        "name": "IT"
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

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
    "role": "MEMBER",
    "division": {
      "id": "div_01ABC",
      "name": "IT"
    }
  }
}
```

---

# 7. Users API

## 7.1 Get Users

### `GET /users`

**Authentication:** 🔐 Required

**Permission:** `ADMIN`, `MANAGER`, `DIVISION_LEADER`

Query:

```text
?page=1
&limit=10
&search=andi
&role=MEMBER
&division_id=div_01ABC
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Data user berhasil diambil",
  "data": [
    {
      "id": "usr_01ABC",
      "name": "Andi",
      "email": "andi@example.com",
      "role": "MEMBER",
      "division": {
        "id": "div_01ABC",
        "name": "IT"
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

---

## 7.2 Get User Detail

### `GET /users/:id`

**Authentication:** 🔐 Required

**Permission:** Semua role, tetapi informasi yang ditampilkan dapat dibatasi berdasarkan role.

**Response `200`:**

```json
{
  "success": true,
  "message": "Data user berhasil diambil",
  "data": {
    "id": "usr_01ABC",
    "name": "Andi",
    "email": "andi@example.com",
    "role": "MEMBER",
    "division": {
      "id": "div_01ABC",
      "name": "IT"
    }
  }
}
```

---

## 7.3 Create User

### `POST /users`

**Authentication:** 🔐 Required

**Permission:** `ADMIN`

**Request:**

```json
{
  "name": "Budi",
  "email": "budi@example.com",
  "password": "Password123",
  "role_id": "rol_leader",
  "division_id": "div_01ABC"
}
```

**Response `201`:**

```json
{
  "success": true,
  "message": "User berhasil dibuat",
  "data": {
    "id": "usr_02ABC",
    "name": "Budi",
    "email": "budi@example.com",
    "role": "DIVISION_LEADER",
    "division": {
      "id": "div_01ABC",
      "name": "IT"
    }
  }
}
```

---

## 7.4 Update User

### `PUT /users/:id`

**Authentication:** 🔐 Required

**Permission:** `ADMIN`

**Request:**

```json
{
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "role_id": "rol_leader",
  "division_id": "div_01ABC"
}
```

**Response `200`:**

```json
{
  "success": true,
  "message": "User berhasil diperbarui",
  "data": {}
}
```

---

## 7.5 Delete User

### `DELETE /users/:id`

**Authentication:** 🔐 Required

**Permission:** `ADMIN`

**Response `204`:**

No response body.

---

# 8. Roles API

## 8.1 Get Roles

### `GET /roles`

**Authentication:** 🔐 Required

**Permission:** Semua role.

**Response:**

```json
{
  "success": true,
  "message": "Data role berhasil diambil",
  "data": [
    {
      "id": "rol_admin",
      "name": "ADMIN",
      "description": "Administrator sistem"
    },
    {
      "id": "rol_manager",
      "name": "MANAGER",
      "description": "Pengelola project dan task"
    },
    {
      "id": "rol_leader",
      "name": "DIVISION_LEADER",
      "description": "Pemimpin division"
    },
    {
      "id": "rol_member",
      "name": "MEMBER",
      "description": "Anggota division"
    }
  ]
}
```

Role tidak memiliki endpoint CRUD untuk MVP karena role merupakan data sistem.

---

# 9. Divisions API

## 9.1 Get Divisions

### `GET /divisions`

**Authentication:** 🔐 Required

**Permission:** Semua role.

Query:

```text
?page=1
&limit=10
&search=IT
```

**Response:**

```json
{
  "success": true,
  "message": "Data division berhasil diambil",
  "data": [
    {
      "id": "div_01ABC",
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

---

## 9.2 Create Division

### `POST /divisions`

**Authentication:** 🔐 Required

**Permission:** `ADMIN`

**Request:**

```json
{
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
    "name": "IT",
    "leader": null
  }
}
```

---

## 9.3 Get Division Detail

### `GET /divisions/:id`

**Authentication:** 🔐 Required

**Permission:** Semua role.

**Response:**

```json
{
  "success": true,
  "message": "Data division berhasil diambil",
  "data": {
    "id": "div_01ABC",
    "name": "IT",
    "leader": {
      "id": "usr_01ABC",
      "name": "Budi"
    },
    "members": [
      {
        "id": "usr_01ABC",
        "name": "Budi",
        "role": "DIVISION_LEADER"
      },
      {
        "id": "usr_02ABC",
        "name": "Andi",
        "role": "MEMBER"
      }
    ]
  }
}
```

---

## 9.4 Update Division

### `PUT /divisions/:id`

**Authentication:** 🔐 Required

**Permission:** `ADMIN`

**Request:**

```json
{
  "name": "Information Technology"
}
```

---

## 9.5 Delete Division

### `DELETE /divisions/:id`

**Authentication:** 🔐 Required

**Permission:** `ADMIN`

Division yang masih memiliki anggota sebaiknya tidak dapat langsung dihapus.

Jika masih memiliki anggota:

```json
{
  "success": false,
  "message": "Division masih memiliki anggota",
  "error": {
    "code": "DIVISION_NOT_EMPTY",
    "details": null
  }
}
```

---

## 9.6 Get Division Members

### `GET /divisions/:id/members`

**Authentication:** 🔐 Required

**Permission:** Semua role.

**Response:**

```json
{
  "success": true,
  "message": "Anggota division berhasil diambil",
  "data": [
    {
      "id": "usr_01ABC",
      "name": "Budi",
      "role": "DIVISION_LEADER"
    },
    {
      "id": "usr_02ABC",
      "name": "Andi",
      "role": "MEMBER"
    }
  ]
}
```

---

## 9.7 Set Division Leader

### `PUT /divisions/:id/leader`

**Authentication:** 🔐 Required

**Permission:** `ADMIN`

**Request:**

```json
{
  "user_id": "usr_01ABC"
}
```

Backend harus memastikan user tersebut merupakan anggota division yang sama.

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

# 10. Projects API

## 10.1 Get Projects

### `GET /projects`

**Authentication:** 🔐 Required

**Permission:** Semua role.

Query:

```text
?page=1
&limit=10
&search=Absensi
```

**Response:**

```json
{
  "success": true,
  "message": "Data project berhasil diambil",
  "data": [
    {
      "id": "prj_01ABC",
      "name": "Sistem Absensi",
      "description": "Pengembangan sistem absensi",
      "deadline": "2026-10-30T23:59:59Z",
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

---

## 10.2 Create Project

### `POST /projects`

**Authentication:** 🔐 Required

**Permission:** `MANAGER`

**Request:**

```json
{
  "name": "Sistem Absensi",
  "description": "Pengembangan sistem absensi mahasiswa",
  "deadline": "2026-10-30T23:59:59Z"
}
```

**Response `201`:**

```json
{
  "success": true,
  "message": "Project berhasil dibuat",
  "data": {
    "id": "prj_01ABC",
    "name": "Sistem Absensi",
    "description": "Pengembangan sistem absensi mahasiswa",
    "deadline": "2026-10-30T23:59:59Z"
  }
}
```

---

## 10.3 Get Project Detail

### `GET /projects/:id`

**Authentication:** 🔐 Required

**Permission:** Semua role.

**Response:**

```json
{
  "success": true,
  "message": "Data project berhasil diambil",
  "data": {
    "id": "prj_01ABC",
    "name": "Sistem Absensi",
    "description": "Pengembangan sistem absensi mahasiswa",
    "deadline": "2026-10-30T23:59:59Z",
    "tasks": []
  }
}
```

---

## 10.4 Update Project

### `PUT /projects/:id`

**Authentication:** 🔐 Required

**Permission:** `MANAGER`

**Request:**

```json
{
  "name": "Sistem Absensi Mahasiswa",
  "description": "Updated description",
  "deadline": "2026-11-15T23:59:59Z"
}
```

---

## 10.5 Delete Project

### `DELETE /projects/:id`

**Authentication:** 🔐 Required

**Permission:** `MANAGER`

Project beserta task di dalamnya dapat dihapus menggunakan cascade sesuai aturan database.

---

# 11. Tasks API

Task merupakan resource utama dalam sistem.

## 11.1 Get Tasks

### `GET /tasks`

**Authentication:** 🔐 Required

**Permission:** Semua role.

Backend secara otomatis melakukan filtering berdasarkan role.

### Query Parameters

```text
?page=1
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

### Scope

`ADMIN` dan `MANAGER` dapat melihat task sesuai kewenangannya.

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

---

# 12. Create Task

### `POST /tasks`

**Authentication:** 🔐 Required

**Permission:** `MANAGER`, `DIVISION_LEADER`

## Request — assign to member

```json
{
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
  "project_id": "prj_01ABC",
  "parent_task_id": "tsk_01ABC",
  "title": "Membuat endpoint login",
  "description": "Implementasi endpoint POST /auth/login",
  "priority": "P1",
  "deadline": "2026-10-01T23:59:59Z",
  "assignee_id": "usr_02ABC"
}
```

**Response `201`:**

```json
{
  "success": true,
  "message": "Task berhasil dibuat",
  "data": {
    "id": "tsk_02ABC",
    "title": "Membuat endpoint login",
    "status": "ASSIGNED",
    "priority": "P1"
  }
}
```

---

# 13. Get Task Detail

### `GET /tasks/:id`

**Authentication:** 🔐 Required

**Permission:** Sesuai task scope.

**Response:**

```json
{
  "success": true,
  "message": "Data task berhasil diambil",
  "data": {
    "id": "tsk_01ABC",
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

---

# 14. Update Task

### `PUT /tasks/:id`

**Authentication:** 🔐 Required

**Permission:**

* `MANAGER`
* `DIVISION_LEADER` untuk task dalam kewenangannya

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

---

# 15. Delete Task

### `DELETE /tasks/:id`

**Authentication:** 🔐 Required

**Permission:**

* `MANAGER`
* `DIVISION_LEADER` untuk task dalam kewenangannya

Subtask akan ikut terhapus apabila menggunakan cascade sesuai konfigurasi database.

---

# 16. Update Task Status

### `PUT /tasks/:id/status`

**Authentication:** 🔐 Required

**Permission:**

* `MEMBER` untuk task miliknya
* `DIVISION_LEADER` untuk task dalam kewenangannya
* `MANAGER` untuk task dalam kewenangannya

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

---

# 17. Delegate Task

### `POST /tasks/:id/delegate`

Digunakan untuk memberikan task atau membuat delegasi kepada user/division.

**Authentication:** 🔐 Required

**Permission:**

* `MANAGER`
* `DIVISION_LEADER` sesuai scope

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

Backend wajib memvalidasi bahwa `DIVISION_LEADER` hanya dapat mendelegasikan task kepada anggota divisinya.

---

# 18. Get Subtasks

### `GET /tasks/:id/subtasks`

**Authentication:** 🔐 Required

**Permission:** Sesuai task scope.

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

# 19. Task History

### `GET /tasks/:id/history`

**Authentication:** 🔐 Required

**Permission:**

* `ADMIN`
* `MANAGER`
* `DIVISION_LEADER` sesuai scope
* `MEMBER` untuk task miliknya

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
```

---

# 20. Task Attachments

## 20.1 Upload Attachment

### `POST /tasks/:id/attachments`

**Authentication:** 🔐 Required

**Permission:**

* `MANAGER`
* `DIVISION_LEADER` sesuai scope
* `MEMBER` untuk task miliknya

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

---

## 20.2 Get Attachments

### `GET /tasks/:id/attachments`

**Authentication:** 🔐 Required

**Permission:** Sesuai task scope.

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

## 20.3 Delete Attachment

### `DELETE /tasks/:taskId/attachments/:attachmentId`

**Authentication:** 🔐 Required

**Permission:**

* `MANAGER`
* `DIVISION_LEADER` sesuai scope

**Response:**

```json
{
  "success": true,
  "message": "Attachment berhasil dihapus",
  "data": null
}
```

---

# 21. Dashboard API

Dashboard menggunakan endpoint khusus agar frontend tidak perlu melakukan banyak request untuk menghitung statistik.

## 21.1 Dashboard Summary

### `GET /dashboard/summary`

**Authentication:** 🔐 Required

**Permission:** Semua role.

Response disesuaikan dengan role user.

```json
{
  "success": true,
  "message": "Dashboard berhasil diambil",
  "data": {
    "totalTasks": 25,
    "completedTasks": 10,
    "inProgressTasks": 8,
    "reviewTasks": 3,
    "overdueTasks": 4,
    "completionRate": 40
  }
}
```

---

## 21.2 Dashboard Task Statistics

### `GET /dashboard/tasks`

**Authentication:** 🔐 Required

**Permission:** Semua role.

Query:

```text
?project_id=prj_01ABC
&division_id=div_01ABC
```

Response:

```json
{
  "success": true,
  "message": "Statistik task berhasil diambil",
  "data": {
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

# 22. Search, Filtering & Pagination

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
?status=IN_PROGRESS
&priority=P1
&division_id=div_01ABC
&assignee_id=usr_01ABC
&project_id=prj_01ABC
```

Sorting:

```text
?sort=deadline&order=asc
```

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

# 23. Error Codes

| Code                    | Keterangan                      |
| ----------------------- | ------------------------------- |
| `VALIDATION_ERROR`      | Data tidak valid                |
| `INVALID_CREDENTIALS`   | Email/password salah            |
| `UNAUTHORIZED`          | Authentication diperlukan       |
| `FORBIDDEN`             | Tidak memiliki permission       |
| `USER_NOT_FOUND`        | User tidak ditemukan            |
| `ROLE_NOT_FOUND`        | Role tidak ditemukan            |
| `DIVISION_NOT_FOUND`    | Division tidak ditemukan        |
| `DIVISION_NOT_EMPTY`    | Division masih memiliki anggota |
| `PROJECT_NOT_FOUND`     | Project tidak ditemukan         |
| `TASK_NOT_FOUND`        | Task tidak ditemukan            |
| `TASK_ACCESS_DENIED`    | Tidak memiliki akses ke task    |
| `INVALID_TASK_STATUS`   | Status task tidak valid         |
| `INVALID_DELEGATION`    | Delegasi tidak diperbolehkan    |
| `ATTACHMENT_NOT_FOUND`  | Attachment tidak ditemukan      |
| `FILE_TOO_LARGE`        | Ukuran file terlalu besar       |
| `UNSUPPORTED_FILE_TYPE` | Tipe file tidak didukung        |
| `EMAIL_ALREADY_EXISTS`  | Email sudah digunakan           |
| `RESOURCE_CONFLICT`     | Terjadi konflik resource        |
| `INTERNAL_SERVER_ERROR` | Kesalahan internal server       |

---

# 24. Resource Relationship

Relasi utama API:

```text
User
 │
 ├── Role
 │
 └── Division
       │
       └── Members
             │
             └── Tasks

Project
 │
 └── Tasks
       │
       ├── Parent Task
       │      └── Subtasks
       │
       ├── Assignee
       │
       ├── Division
       │
       ├── History
       │
       └── Attachments
```

---

# 25. Main Business Flow

## Manager

```text
Login
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
Submit for Review
  ↓
Completed
```

---

# 26. Role-Based Task Scope

Aturan akses task:

```text
ADMIN
 └── System-level access

MANAGER
 └── Project
      └── All related Tasks

DIVISION_LEADER
 └── Own Division
      ├── Tasks assigned to Division
      ├── Tasks assigned to Leader
      └── Subtasks delegated to Division Members

MEMBER
 └── Own Assigned Tasks
```

Backend **tidak boleh hanya mengandalkan role** untuk menentukan akses. Selain pengecekan role, backend harus melakukan pengecekan terhadap relasi resource.

Contoh:

```text
DIVISION_LEADER IT
       │
       ├── boleh → Task Division IT
       │
       └── tidak boleh → Task Division Marketing
```
---

# 27. API Endpoint Summary

| Method | Endpoint                                   | Auth | Role                 |
| ------ | ------------------------------------------ | ---- | -------------------- |
| POST   | `/auth/register`                           | ❌    | Public               |
| POST   | `/auth/login`                              | ❌    | Public               |
| POST   | `/auth/logout`                             | ✅    | All                  |
| GET    | `/auth/me`                                 | ✅    | All                  |
| GET    | `/users`                                   | ✅    | Admin/Manager/Leader |
| GET    | `/users/:id`                               | ✅    | All                  |
| POST   | `/users`                                   | ✅    | Admin                |
| PUT    | `/users/:id`                               | ✅    | Admin                |
| DELETE | `/users/:id`                               | ✅    | Admin                |
| GET    | `/roles`                                   | ✅    | All                  |
| GET    | `/divisions`                               | ✅    | All                  |
| POST   | `/divisions`                               | ✅    | Admin                |
| GET    | `/divisions/:id`                           | ✅    | All                  |
| PUT    | `/divisions/:id`                           | ✅    | Admin                |
| DELETE | `/divisions/:id`                           | ✅    | Admin                |
| GET    | `/divisions/:id/members`                   | ✅    | All                  |
| PUT    | `/divisions/:id/leader`                    | ✅    | Admin                |
| GET    | `/projects`                                | ✅    | All                  |
| POST   | `/projects`                                | ✅    | Manager              |
| GET    | `/projects/:id`                            | ✅    | All                  |
| PUT    | `/projects/:id`                            | ✅    | Manager              |
| DELETE | `/projects/:id`                            | ✅    | Manager              |
| GET    | `/tasks`                                   | ✅    | All                  |
| POST   | `/tasks`                                   | ✅    | Manager/Leader       |
| GET    | `/tasks/:id`                               | ✅    | Scope                |
| PUT    | `/tasks/:id`                               | ✅    | Manager/Leader       |
| DELETE | `/tasks/:id`                               | ✅    | Manager/Leader       |
| PUT    | `/tasks/:id/status`                        | ✅    | Scope                |
| POST   | `/tasks/:id/delegate`                      | ✅    | Manager/Leader       |
| GET    | `/tasks/:id/subtasks`                      | ✅    | Scope                |
| GET    | `/tasks/:id/history`                       | ✅    | Scope                |
| POST   | `/tasks/:id/attachments`                   | ✅    | Scope                |
| GET    | `/tasks/:id/attachments`                   | ✅    | Scope                |
| DELETE | `/tasks/:taskId/attachments/:attachmentId` | ✅    | Manager/Leader       |
| GET    | `/dashboard/summary`                       | ✅    | All                  |
| GET    | `/dashboard/tasks`                         | ✅    | All                  |
