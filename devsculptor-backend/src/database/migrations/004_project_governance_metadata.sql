-- 004_project_governance_metadata.sql
-- Agrega metadatos de gobernanza institucional a la tabla projects

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS organization VARCHAR(255),
  ADD COLUMN IF NOT EXISTS lead_architect VARCHAR(255);
