-- ============================================================================
-- Migration 012: Align Global Vault Categories Check Constraint
-- DevSculptor Architecture Governance & Schema Alignment (SEC-09)
-- ============================================================================

ALTER TABLE public.global_vault_templates
  DROP CONSTRAINT IF EXISTS global_vault_templates_category_check;

ALTER TABLE public.global_vault_templates
  ADD CONSTRAINT global_vault_templates_category_check
  CHECK (category IN (
    'manifest',
    'documentation',
    'database',
    'skills',
    'context',
    'templates',
    'rules',
    'archetypes',
    'sources'
  ));
