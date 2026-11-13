-- =========================================================
-- 1. USERS
-- =========================================================

CREATE TABLE users (
    id VARCHAR(26) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255), -- NULL untuk akun yang hanya memakai Google.

    -- Akun Google: diisi saat register/login Google.
    google_id VARCHAR(255) UNIQUE,
    auth_provider VARCHAR(10) NOT NULL DEFAULT 'EMAIL',

    -- TRUE setelah pengguna menyelesaikan onboarding (membuat workspace). FALSE = baru register.
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_auth_provider
        CHECK (auth_provider IN ('EMAIL', 'GOOGLE')),

    CONSTRAINT chk_auth_credentials
        CHECK (
            (auth_provider = 'GOOGLE' OR password IS NOT NULL)
            AND (auth_provider = 'EMAIL' OR google_id IS NOT NULL)
        )
);


-- =========================================================
-- 2. INDUSTRIES (bidang usaha)
-- =========================================================

CREATE TABLE industries (
    id VARCHAR(26) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    created_by VARCHAR(26),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_industry_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT uq_industry_name_creator
        UNIQUE (name, created_by)
);

-- =========================================================
-- 3. WORKSPACES
-- =========================================================

CREATE TABLE workspaces (
    id VARCHAR(26) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,

    industry_id VARCHAR(26),

    owner_id VARCHAR(26) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_workspace_industry
        FOREIGN KEY (industry_id)
        REFERENCES industries(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_workspace_owner
        FOREIGN KEY (owner_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_workspace_owner
        UNIQUE (owner_id)
);


-- =========================================================
-- 4. WORKSPACE ROLES
-- =========================================================

CREATE TABLE workspace_roles (
    id VARCHAR(26) PRIMARY KEY,

    workspace_id VARCHAR(26),

    name VARCHAR(100) NOT NULL,
    description TEXT,

    is_system BOOLEAN NOT NULL DEFAULT FALSE,

    created_by VARCHAR(26),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_workspace_role_workspace
        FOREIGN KEY (workspace_id)
        REFERENCES workspaces(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_workspace_role_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_workspace_role_system
        CHECK (
            (is_system = TRUE AND workspace_id IS NULL)
            OR (is_system = FALSE AND workspace_id IS NOT NULL)
        ),

    CONSTRAINT uq_workspace_role_name
        UNIQUE (workspace_id, name)
);

-- =========================================================
-- 5. ROLE PERMISSIONS
-- =========================================================

CREATE TABLE role_permissions (
    id VARCHAR(26) PRIMARY KEY,

    role_id VARCHAR(26) NOT NULL,
    permission VARCHAR(50) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_role_permission_role
        FOREIGN KEY (role_id)
        REFERENCES workspace_roles(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_role_permission_catalog
        CHECK (
            permission IN (
                'workspace.view',
                'workspace.update',
                'workspace.delete',
                'workspace.manage_divisions',
                'workspace.manage_templates',
                'workspace.manage_industries',
                'member.invite',
                'member.manage',
                'project.create',
                'project.update',
                'project.delete',
                'project.view',
                'task.create',
                'task.update',
                'task.delete',
                'task.delegate',
                'task.update_status',
                'task.view',
                'attachment.upload',
                'attachment.delete',
                'comment.create',
                'dashboard.view',
                'analytics.view',
                'history.view'
            )
        ),

    CONSTRAINT uq_role_permission
        UNIQUE (role_id, permission)
);


-- =========================================================
-- 6. WORKSPACE MEMBERSHIPS
-- =========================================================

CREATE TABLE workspace_memberships (
    id VARCHAR(26) PRIMARY KEY,

    workspace_id VARCHAR(26) NOT NULL,
    user_id VARCHAR(26) NOT NULL,

    role_id VARCHAR(26) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_membership_workspace
        FOREIGN KEY (workspace_id)
        REFERENCES workspaces(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_membership_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_membership_role
        FOREIGN KEY (role_id)
        REFERENCES workspace_roles(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_membership_workspace_user
        UNIQUE (workspace_id, user_id)
);


-- =========================================================
-- 7. DIVISIONS
-- =========================================================

CREATE TABLE divisions (
    id VARCHAR(26) PRIMARY KEY,

    workspace_id VARCHAR(26) NOT NULL,

    name VARCHAR(100) NOT NULL,
    leader_id VARCHAR(26),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_division_workspace
        FOREIGN KEY (workspace_id)
        REFERENCES workspaces(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_division_leader
        FOREIGN KEY (leader_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT uq_division_name_per_workspace
        UNIQUE (workspace_id, name)
);


-- =========================================================
-- 8. PROJECT TEMPLATES (saran proyek per bidang usaha)
-- =========================================================

CREATE TABLE project_templates (
    id VARCHAR(26) PRIMARY KEY,

    industry_id VARCHAR(26),
    workspace_id VARCHAR(26),

    name VARCHAR(150) NOT NULL,
    description TEXT,

    created_by VARCHAR(26),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_project_template_industry
        FOREIGN KEY (industry_id)
        REFERENCES industries(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_project_template_workspace
        FOREIGN KEY (workspace_id)
        REFERENCES workspaces(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_project_template_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- =========================================================
-- 9. PROJECTS
-- =========================================================

CREATE TABLE projects (
    id VARCHAR(26) PRIMARY KEY,

    workspace_id VARCHAR(26) NOT NULL,

    name VARCHAR(150) NOT NULL,
    description TEXT,
    deadline TIMESTAMPTZ,

    owner_id VARCHAR(26) NOT NULL,
    industry_id VARCHAR(26),
    project_template_id VARCHAR(26),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_project_workspace
        FOREIGN KEY (workspace_id)
        REFERENCES workspaces(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_project_owner
        FOREIGN KEY (owner_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_project_industry
        FOREIGN KEY (industry_id)
        REFERENCES industries(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_project_template
        FOREIGN KEY (project_template_id)
        REFERENCES project_templates(id)
        ON DELETE SET NULL
);


-- =========================================================
-- 10. TASK TEMPLATES (template tugas per jenis proyek)
-- =========================================================

CREATE TABLE task_templates (
    id VARCHAR(26) PRIMARY KEY,

    project_template_id VARCHAR(26) NOT NULL,

    parent_template_id VARCHAR(26),

    title VARCHAR(200) NOT NULL,
    description TEXT,

    priority VARCHAR(10) NOT NULL DEFAULT 'P3',
    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_task_template_project
        FOREIGN KEY (project_template_id)
        REFERENCES project_templates(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_task_template_parent
        FOREIGN KEY (parent_template_id)
        REFERENCES task_templates(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_task_template_priority
        CHECK (
            priority IN (
                'P1',
                'P2',
                'P3'
            )
        )
);


-- =========================================================
-- 11. TASKS
-- =========================================================

CREATE TABLE tasks (
    id VARCHAR(26) PRIMARY KEY,

    workspace_id VARCHAR(26) NOT NULL,

    project_id VARCHAR(26) NOT NULL,

    -- NULL = task utama
    -- berisi ID task = subtask
    parent_task_id VARCHAR(26),

    title VARCHAR(200) NOT NULL,
    description TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED',

    priority VARCHAR(10) NOT NULL DEFAULT 'P3',

    deadline TIMESTAMPTZ,

    -- Task ditujukan ke divisi
    division_id VARCHAR(26),

    -- Task ditujukan langsung ke user
    assignee_id VARCHAR(26),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_task_workspace
        FOREIGN KEY (workspace_id)
        REFERENCES workspaces(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_task_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_task_parent
        FOREIGN KEY (parent_task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_task_division
        FOREIGN KEY (division_id)
        REFERENCES divisions(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_task_assignee
        FOREIGN KEY (assignee_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_task_status
        CHECK (
            status IN (
                'BACKLOG',
                'ASSIGNED',
                'IN_PROGRESS',
                'REVIEW',
                'COMPLETED',
                'BLOCKED',
                'CANCELLED'
            )
        ),

    CONSTRAINT chk_task_priority
        CHECK (
            priority IN (
                'P1',
                'P2',
                'P3'
            )
        )
);


-- =========================================================
-- 12. TASK HISTORY
-- =========================================================

CREATE TABLE task_history (
    id VARCHAR(26) PRIMARY KEY,

    task_id VARCHAR(26) NOT NULL,
    user_id VARCHAR(26) NOT NULL,

    action VARCHAR(50) NOT NULL,

    old_status VARCHAR(30),
    new_status VARCHAR(30),

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_history_task
        FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_history_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 13. TASK ATTACHMENTS
-- =========================================================

CREATE TABLE task_attachments (
    id VARCHAR(26) PRIMARY KEY,

    task_id VARCHAR(26) NOT NULL,

    uploaded_by VARCHAR(26) NOT NULL,

    file_name VARCHAR(255) NOT NULL,

    file_url TEXT NOT NULL,

    file_type VARCHAR(100),

    file_size BIGINT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_attachment_task
        FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attachment_user
        FOREIGN KEY (uploaded_by)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================================
-- 14. INVITATIONS (undangan lewat email)
-- =========================================================

CREATE TABLE invitations (
    id VARCHAR(26) PRIMARY KEY,

    workspace_id VARCHAR(26) NOT NULL,
    project_id VARCHAR(26),

    email VARCHAR(255) NOT NULL,
    role_id VARCHAR(26) NOT NULL,

    invited_by VARCHAR(26) NOT NULL,

    token VARCHAR(64) NOT NULL UNIQUE,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_invitation_workspace
        FOREIGN KEY (workspace_id)
        REFERENCES workspaces(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_invitation_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_invitation_role
        FOREIGN KEY (role_id)
        REFERENCES workspace_roles(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_invitation_inviter
        FOREIGN KEY (invited_by)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_invitation_status
        CHECK (
            status IN (
                'PENDING',
                'ACCEPTED',
                'EXPIRED',
                'DECLINED'
            )
        )
);


-- =========================================================
-- 15. INDEX
-- =========================================================

CREATE INDEX idx_users_google_id
ON users(google_id);

CREATE INDEX idx_users_auth_provider
ON users(auth_provider);

CREATE INDEX idx_workspaces_owner_id
ON workspaces(owner_id);

CREATE INDEX idx_workspaces_industry_id
ON workspaces(industry_id);

CREATE INDEX idx_workspace_roles_workspace_id
ON workspace_roles(workspace_id);

CREATE INDEX idx_role_permissions_role_id
ON role_permissions(role_id);

CREATE INDEX idx_memberships_workspace_id
ON workspace_memberships(workspace_id);

CREATE INDEX idx_memberships_user_id
ON workspace_memberships(user_id);

CREATE INDEX idx_memberships_role_id
ON workspace_memberships(role_id);

CREATE INDEX idx_divisions_workspace_id
ON divisions(workspace_id);

CREATE INDEX idx_project_templates_industry_id
ON project_templates(industry_id);

CREATE INDEX idx_project_templates_workspace_id
ON project_templates(workspace_id);

CREATE INDEX idx_projects_workspace_id
ON projects(workspace_id);

CREATE INDEX idx_projects_owner_id
ON projects(owner_id);

CREATE INDEX idx_task_templates_project_id
ON task_templates(project_template_id);

CREATE INDEX idx_task_templates_parent_id
ON task_templates(parent_template_id);

CREATE INDEX idx_tasks_workspace_id
ON tasks(workspace_id);

CREATE INDEX idx_tasks_project_id
ON tasks(project_id);

CREATE INDEX idx_tasks_parent_task_id
ON tasks(parent_task_id);

CREATE INDEX idx_tasks_division_id
ON tasks(division_id);

CREATE INDEX idx_tasks_assignee_id
ON tasks(assignee_id);

CREATE INDEX idx_tasks_status
ON tasks(status);

CREATE INDEX idx_tasks_deadline
ON tasks(deadline);

CREATE INDEX idx_task_history_task_id
ON task_history(task_id);

CREATE INDEX idx_task_history_user_id
ON task_history(user_id);

CREATE INDEX idx_task_attachments_task_id
ON task_attachments(task_id);

CREATE INDEX idx_invitations_workspace_id
ON invitations(workspace_id);

CREATE INDEX idx_invitations_role_id
ON invitations(role_id);

CREATE INDEX idx_invitations_token
ON invitations(token);

CREATE INDEX idx_invitations_email
ON invitations(email);

CREATE INDEX idx_invitations_status
ON invitations(status);


-- =========================================================
-- 16. UPDATED_AT TRIGGER
-- =========================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_industries_updated_at
BEFORE UPDATE ON industries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_workspaces_updated_at
BEFORE UPDATE ON workspaces
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_workspace_roles_updated_at
BEFORE UPDATE ON workspace_roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_memberships_updated_at
BEFORE UPDATE ON workspace_memberships
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_divisions_updated_at
BEFORE UPDATE ON divisions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_project_templates_updated_at
BEFORE UPDATE ON project_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_task_templates_updated_at
BEFORE UPDATE ON task_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_invitations_updated_at
BEFORE UPDATE ON invitations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();


-- =========================================================
-- 17. SEED — DATA SISTEM (contoh)
-- =========================================================
-- Baris-baris di bawah ini di-seed oleh aplikasi saat
-- pertama kali berjalan. Owner workspace boleh menambah
-- bidang usaha dan role kustom sendiri lewat API; baris
-- tambahannya menyimpan created_by = id owner.
--
-- A. Bidang usaha sistem:
-- INSERT INTO industries (id, name, description) VALUES
--   ('ind_software', 'Software House', 'Pengembangan perangkat lunak dan layanan IT'),
--   ('ind_pendidikan', 'Pendidikan', 'Sekolah, kampus, dan lembaga kursus'),
--   ('ind_kesehatan', 'Kesehatan', 'Klinik, rumah sakit, dan layanan kesehatan'),
--   ('ind_retail', 'Retail', 'Toko, distribusi, dan perdagangan'),
--   ('ind_manufaktur', 'Manufaktur', 'Pabrik dan produksi barang'),
--   ('ind_jasa', 'Jasa', 'Konsultan, agensi, dan layanan profesional'),
--   ('ind_lainnya', 'Lainnya', 'Bidang usaha lain')
-- ON CONFLICT DO NOTHING;
--
-- B. Role bawaan sistem (is_system TRUE, workspace_id NULL):
-- INSERT INTO workspace_roles (id, workspace_id, name, description, is_system) VALUES
--   ('role_owner', NULL, 'OWNER', 'Pemilik workspace/proyek', TRUE),
--   ('role_manager', NULL, 'MANAGER', 'Mengelola proyek dan tugas', TRUE),
--   ('role_leader', NULL, 'DIVISION_LEADER', 'Mengelola tugas dan anggota dalam divisinya', TRUE),
--   ('role_member', NULL, 'MEMBER', 'Mengerjakan tugas yang diberikan', TRUE)
-- ON CONFLICT DO NOTHING;
--
-- C. Izin role bawaan sistem:
-- OWNER — semua 24 izin katalog.
-- INSERT INTO role_permissions (id, role_id, permission)
-- SELECT 'rp_owner_' || ROW_NUMBER() OVER (), 'role_owner', p
-- FROM (VALUES ('workspace.view'), ('workspace.update'), ('workspace.delete'),
--   ('workspace.manage_divisions'), ('workspace.manage_templates'),
--   ('workspace.manage_industries'), ('member.invite'), ('member.manage'),
--   ('project.create'), ('project.update'), ('project.delete'), ('project.view'),
--   ('task.create'), ('task.update'), ('task.delete'), ('task.delegate'),
--   ('task.update_status'), ('task.view'),
--   ('attachment.upload'), ('attachment.delete'), ('comment.create'),
--   ('dashboard.view'), ('analytics.view'), ('history.view')) AS t(p)
-- ON CONFLICT DO NOTHING;
--
-- MANAGER — proyek + tugas + lampiran + komentar + dashboard:
-- INSERT INTO role_permissions (id, role_id, permission)
-- SELECT 'rp_manager_' || ROW_NUMBER() OVER (), 'role_manager', p
-- FROM (VALUES ('project.create'), ('project.update'), ('project.delete'),
--   ('project.view'), ('task.create'), ('task.update'), ('task.delete'),
--   ('task.delegate'), ('task.update_status'), ('task.view'),
--   ('attachment.upload'), ('attachment.delete'), ('comment.create'),
--   ('dashboard.view'), ('analytics.view'), ('history.view')) AS t(p)
-- ON CONFLICT DO NOTHING;
--
-- DIVISION_LEADER — tugas divisinya + undang anggota ke divisinya:
-- INSERT INTO role_permissions (id, role_id, permission)
-- SELECT 'rp_leader_' || ROW_NUMBER() OVER (), 'role_leader', p
-- FROM (VALUES ('task.create'), ('task.update'), ('task.delete'),
--   ('task.delegate'), ('task.update_status'), ('task.view'),
--   ('attachment.upload'), ('attachment.delete'), ('comment.create'),
--   ('member.invite'), ('dashboard.view'), ('history.view')) AS t(p)
-- ON CONFLICT DO NOTHING;
--
-- MEMBER — mengerjakan tugas sendiri:
-- INSERT INTO role_permissions (id, role_id, permission)
-- SELECT 'rp_member_' || ROW_NUMBER() OVER (), 'role_member', p
-- FROM (VALUES ('task.update_status'), ('task.view'),
--   ('attachment.upload'), ('comment.create'),
--   ('dashboard.view'), ('history.view')) AS t(p)
-- ON CONFLICT DO NOTHING;
