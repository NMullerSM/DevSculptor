-- ============================================================================
-- Migration 010: RLS Hardening & PostgREST Surface Reduction
-- DevSculptor Architecture Governance & Security (Pilar 8, SEC-07)
-- ============================================================================

-- 1. Habilitación estricta de Row Level Security en tablas de infraestructura y bóveda
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_vault_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public._migrations ENABLE ROW LEVEL SECURITY;

-- 2. Revocación preventiva de permisos de acceso directo vía API PostgREST (anon / authenticated)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public.users FROM anon, authenticated;
    REVOKE ALL ON public.password_resets FROM anon, authenticated;
    REVOKE ALL ON public.global_vault_templates FROM anon, authenticated;
    REVOKE ALL ON public._migrations FROM anon, authenticated;
  END IF;
END $$;

-- 3. Fijación inmutable de search_path en función con privilegios elevados (SECURITY DEFINER)
ALTER FUNCTION public.is_superadmin(UUID) SET search_path = public, pg_temp;
