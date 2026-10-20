-- 014_ai_context_and_diagrams_persistence.sql
-- Ampliación de esquema para trazabilidad RAG, gobernanza de ADRs y persistencia completa del OKF

-- 1. Soporte para relación de entidades en requisitos
ALTER TABLE requirements
  ADD COLUMN IF NOT EXISTS entity_relation TEXT[] DEFAULT '{}';

-- 2. Código identificador unívoco para decisiones de arquitectura (ADR-XXX)
ALTER TABLE architecture_decisions
  ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- Backfill para decisiones existentes sin código
UPDATE architecture_decisions ad
SET code = 'ADR-' || LPAD(sub.rn::text, 3, '0')
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at ASC) as rn
  FROM architecture_decisions
) sub
WHERE ad.id = sub.id AND ad.code IS NULL;

CREATE INDEX IF NOT EXISTS idx_architecture_decisions_code ON architecture_decisions(project_id, code);

-- 3. Contenido markdown completo para documentos de la bóveda OKF
ALTER TABLE okf_documents
  ADD COLUMN IF NOT EXISTS content_markdown TEXT;
