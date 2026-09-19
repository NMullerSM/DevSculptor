-- ============================================================================
-- Migración 006: Roles de Usuario (RBAC) y Políticas de Administrador Maestro
-- ============================================================================

-- 1. Adición de columnas 'role' e 'is_active' en la tabla 'users'
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'USER' 
  CHECK (role IN ('USER', 'ADMIN', 'SUPERADMIN'));

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Índice B-Tree para optimización de consultas por rol
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- 3. Promoción del Arquitecto Líder a SUPERADMIN
UPDATE users 
SET role = 'SUPERADMIN' 
WHERE email IN (
  'nathaniel@devsculptor.io', 
  'nmullersm@gmail.com',
  'dev@devsculptor.test'
);

-- 4. Creación de vista o función auxiliar para verificar si el usuario es SUPERADMIN
CREATE OR REPLACE FUNCTION is_superadmin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_uuid AND role = 'SUPERADMIN' AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Actualización de políticas RLS en storage.objects para el bucket 'okf-vault'
-- Permite acceso universal a usuarios con rol SUPERADMIN sobre cualquier carpeta de 'okf-vault'
DO $$
BEGIN
  -- Política de lectura universal para Superadmin
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'okf_vault_superadmin_select'
  ) THEN
    CREATE POLICY "okf_vault_superadmin_select" ON storage.objects
    FOR SELECT USING (
      bucket_id = 'okf-vault' AND
      is_superadmin(auth.uid())
    );
  END IF;

  -- Política de inserción universal para Superadmin
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'okf_vault_superadmin_insert'
  ) THEN
    CREATE POLICY "okf_vault_superadmin_insert" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'okf-vault' AND
      is_superadmin(auth.uid())
    );
  END IF;

  -- Política de actualización universal para Superadmin
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'okf_vault_superadmin_update'
  ) THEN
    CREATE POLICY "okf_vault_superadmin_update" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'okf-vault' AND
      is_superadmin(auth.uid())
    );
  END IF;

  -- Política de eliminación universal para Superadmin
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'okf_vault_superadmin_delete'
  ) THEN
    CREATE POLICY "okf_vault_superadmin_delete" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'okf-vault' AND
      is_superadmin(auth.uid())
    );
  END IF;
END $$;

-- 6. Tabla para la Bóveda Global de Plantillas y Fuentes OKF
CREATE TABLE IF NOT EXISTS global_vault_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path VARCHAR(255) NOT NULL UNIQUE,
  filename VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('templates', 'skills', 'rules', 'archetypes')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  state_hash CHAR(64) NOT NULL,
  author VARCHAR(150) NOT NULL DEFAULT 'Nathaniel Muller (Master Architect)',
  version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_global_templates_path ON global_vault_templates (path);
CREATE INDEX IF NOT EXISTS idx_global_templates_category ON global_vault_templates (category);

-- Trigger para updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_global_vault_templates_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_global_vault_templates_updated_at
      BEFORE UPDATE ON global_vault_templates
      FOR EACH ROW
      EXECUTE FUNCTION fn_set_updated_at();
  END IF;
END $$;

-- 7. Registro de migración
INSERT INTO _migrations (filename)
SELECT '006_add_user_roles_and_master_admin.sql'
WHERE NOT EXISTS (SELECT 1 FROM _migrations WHERE filename = '006_add_user_roles_and_master_admin.sql');

