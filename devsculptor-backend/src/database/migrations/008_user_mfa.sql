-- ============================================================================
-- Migration 008: User MFA / 2FA Columns
-- DevSculptor Architecture Governance & Security
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(255);
