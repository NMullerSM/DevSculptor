-- ============================================================================
-- Migration 013: Supabase Security Advisors Hardening
-- DevSculptor Architecture Governance (SEC-07, Linter 0011, 0028, 0029)
-- ============================================================================

-- 1. Revocar permiso de ejecución pública sobre función SECURITY DEFINER
DO $$
BEGIN
  REVOKE EXECUTE ON FUNCTION public.is_superadmin(UUID) FROM PUBLIC;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE EXECUTE ON FUNCTION public.is_superadmin(UUID) FROM anon, authenticated;
  END IF;
END $$;

-- 2. Fijar search_path inmutable en funciones y procedimientos PL/pgSQL
ALTER FUNCTION public.sp_calculate_project_metrics(UUID) SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_audit_canvas_entities() SET search_path = public, pg_temp;
