-- 001_initial_schema.sql
-- Creación de extensiones y tablas base del Monolito Modular DevSculptor

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Función para auto-actualización de updated_at
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Tabla: users
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla: projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  architecture_style VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_projects_user_name UNIQUE(user_id, name)
);

DROP TRIGGER IF EXISTS trg_set_updated_at_projects ON projects;
CREATE TRIGGER trg_set_updated_at_projects
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- 3. Tabla: requirements
CREATE TABLE IF NOT EXISTS requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(10) NOT NULL CHECK (type IN ('RF', 'RNF')),
  priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_requirements_project_code UNIQUE(project_id, code)
);

-- 4. Tabla: canvas_entities
CREATE TABLE IF NOT EXISTS canvas_entities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  table_name VARCHAR(255) NOT NULL,
  columns_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_canvas_entities_project_table UNIQUE(project_id, table_name)
);

DROP TRIGGER IF EXISTS trg_set_updated_at_canvas_entities ON canvas_entities;
CREATE TRIGGER trg_set_updated_at_canvas_entities
  BEFORE UPDATE ON canvas_entities
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- 5. Tabla: architecture_decisions
CREATE TABLE IF NOT EXISTS architecture_decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  context TEXT,
  decision TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PROPOSED' CHECK (status IN ('PROPOSED', 'ACCEPTED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_set_updated_at_architecture_decisions ON architecture_decisions;
CREATE TRIGGER trg_set_updated_at_architecture_decisions
  BEFORE UPDATE ON architecture_decisions
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- 6. Tabla: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  payload_before JSONB,
  payload_after JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
