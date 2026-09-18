-- 005_okf_vault_and_storage.sql
-- Creación de la tabla okf_documents para persistencia de la bóveda documental y tracking de Freshness
-- Aprovisionamiento del bucket okf-vault en Supabase Storage

-- 1. Tabla: okf_documents
CREATE TABLE IF NOT EXISTS okf_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_id VARCHAR(100) NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  canonical_path VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  content_preview TEXT,
  state_hash VARCHAR(64) NOT NULL,
  freshness_status VARCHAR(20) NOT NULL DEFAULT 'FRESH' CHECK (freshness_status IN ('FRESH', 'STALE', 'DRIFT_DETECTED')),
  storage_path VARCHAR(255),
  verified_by VARCHAR(150),
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_okf_project_canonical_path UNIQUE(project_id, canonical_path)
);

-- Trigger de updated_at
DROP TRIGGER IF EXISTS trg_set_updated_at_okf_documents ON okf_documents;
CREATE TRIGGER trg_set_updated_at_okf_documents
  BEFORE UPDATE ON okf_documents
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Índices para búsqueda de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_okf_docs_project_id ON okf_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_okf_docs_freshness ON okf_documents(freshness_status);
CREATE INDEX IF NOT EXISTS idx_okf_docs_type ON okf_documents(document_type);

-- Blindaje RLS (Pilar 8)
ALTER TABLE okf_documents ENABLE ROW LEVEL SECURITY;

-- 2. Aseguramiento del Bucket okf-vault en storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'okf-vault',
  'okf-vault',
  false,
  52428800,
  ARRAY['application/zip', 'text/markdown', 'text/x-markdown', 'application/sql', 'text/x-sql', 'application/pdf', 'application/json', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Políticas de Seguridad RLS en storage.objects para okf-vault
DROP POLICY IF EXISTS "okf_vault_read_policy" ON storage.objects;
CREATE POLICY "okf_vault_read_policy" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'okf-vault' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (storage.foldername(name))[1] = 'system-templates'
  )
);

DROP POLICY IF EXISTS "okf_vault_insert_policy" ON storage.objects;
CREATE POLICY "okf_vault_insert_policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'okf-vault' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "okf_vault_update_policy" ON storage.objects;
CREATE POLICY "okf_vault_update_policy" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'okf-vault' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "okf_vault_delete_policy" ON storage.objects;
CREATE POLICY "okf_vault_delete_policy" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'okf-vault' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

