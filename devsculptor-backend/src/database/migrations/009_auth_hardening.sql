-- ============================================================================
-- Migration 009: Authentication Hardening & Session Security
-- DevSculptor Architecture Governance & Security (SEC-03, SEC-04)
-- ============================================================================

-- 1. Versión de tokens para revocación instantánea de sesiones
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

-- 2. Protección contra ataques de fuerza bruta y bloqueo de cuentas
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- 3. Protección contra replay de tokens TOTP
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_last_used_step BIGINT;

-- 4. Almacenamiento seguro de secretos TOTP en configuración y cifrado en reposo
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_pending_secret VARCHAR(512);
ALTER TABLE users ALTER COLUMN mfa_secret TYPE VARCHAR(512);
