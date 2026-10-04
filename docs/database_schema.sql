-- =========================================================
-- 1. ROLES
-- =========================================================

CREATE TABLE roles (
    id VARCHAR(26) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- 2. DIVISIONS
-- =========================================================

CREATE TABLE divisions (
    id VARCHAR(26) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    leader_id VARCHAR(26),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- 3. USERS
-- =========================================================

CREATE TABLE users (
    id VARCHAR(26) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,

    role_id VARCHAR(26) NOT NULL,
    division_id VARCHAR(26),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_user_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_user_division
        FOREIGN KEY (division_id)
        REFERENCES divisions(id)
        ON DELETE SET NULL
);


-- Setelah users dan divisions sama-sama tersedia,
-- baru hubungkan leader divisi ke users.

ALTER TABLE divisions
ADD CONSTRAINT fk_division_leader
FOREIGN KEY (leader_id)
REFERENCES users(id)
ON DELETE SET NULL;


-- =========================================================
-- 4. PROJECTS
-- =========================================================

CREATE TABLE projects (
    id VARCHAR(26) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    deadline TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- =========================================================
-- 5. TASKS
-- =========================================================

CREATE TABLE tasks (
    id VARCHAR(26) PRIMARY KEY,

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
-- 6. TASK HISTORY
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
-- 7. TASK ATTACHMENTS
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
-- 8. INDEX
-- =========================================================

CREATE INDEX idx_users_role_id
ON users(role_id);

CREATE INDEX idx_users_division_id
ON users(division_id);

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


-- =========================================================
-- 9. UPDATED_AT TRIGGER
-- =========================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trigger_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();


CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();


CREATE TRIGGER trigger_divisions_updated_at
BEFORE UPDATE ON divisions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();


CREATE TRIGGER trigger_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();


CREATE TRIGGER trigger_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
