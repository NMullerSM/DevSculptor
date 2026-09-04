-- 003_security_and_performance_fixes.sql
-- Remediación de hallazgos identificados por Supabase Linter (Sprint 1)

-- 1. [SEC-01] Habilitación de Row Level Security (RLS) en todas las entidades públicas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. [SEC-02] Fijación de search_path inmutable para funciones y procedimientos
ALTER FUNCTION public.fn_set_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_audit_canvas_entities() SET search_path = public, pg_temp;
ALTER FUNCTION public.sp_calculate_project_metrics(UUID) SET search_path = public, pg_temp;

-- 3. [PERF-01] Eliminación del índice duplicado en users(email)
DROP INDEX IF EXISTS public.idx_users_email;

-- 4. [PERF-02] Creación de índice de cobertura para la FK user_id en audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
