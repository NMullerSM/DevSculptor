-- 002_indexes.sql
-- Índices de rendimiento para FKs y consultas frecuentes

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_requirements_project_id ON requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_requirements_type ON requirements(type);
CREATE INDEX IF NOT EXISTS idx_canvas_entities_project_id ON canvas_entities(project_id);
CREATE INDEX IF NOT EXISTS idx_architecture_decisions_project_id ON architecture_decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_architecture_decisions_status ON architecture_decisions(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_project_id ON audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
