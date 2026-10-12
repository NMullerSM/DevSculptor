import { getPool } from '../../config/database';
import { logger } from '../../config/logger';

export interface RequestContext {
  ip?: string | null;
  userAgent?: string | null;
}

export const SecurityEventType = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  LOGIN_BLOCKED: 'LOGIN_BLOCKED',
  MFA_REQUIRED: 'MFA_REQUIRED',
  MFA_FAILED: 'MFA_FAILED',
  MFA_ENABLED: 'MFA_ENABLED',
  MFA_DISABLED: 'MFA_DISABLED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
} as const;

export type SecurityEventType = (typeof SecurityEventType)[keyof typeof SecurityEventType];

export interface RecordSecurityEventParams {
  userId?: string | null;
  eventType: SecurityEventType | string;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

export class SecurityEventService {
  /**
   * Persiste de forma asíncrona y no bloqueante eventos críticos de seguridad en security_events.
   * Filtra metadatos para evitar el almacenamiento de credenciales o secretos (SEC-10).
   */
  static async record(params: RecordSecurityEventParams): Promise<void> {
    try {
      const pool = getPool();
      const safeMetadata = { ...(params.metadata || {}) };

      // Sanitizar claves sensibles en metadatos
      delete safeMetadata.password;
      delete safeMetadata.token;
      delete safeMetadata.apiKey;
      delete safeMetadata.mfaSecret;
      delete safeMetadata.secret;

      await pool.query(
        `INSERT INTO public.security_events (user_id, event_type, ip, user_agent, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          params.userId || null,
          params.eventType,
          params.ip || null,
          params.userAgent || null,
          JSON.stringify(safeMetadata),
        ]
      );
    } catch (err) {
      logger.error(
        { err, eventType: params.eventType },
        'Fallo al registrar evento de auditoría de seguridad en base de datos'
      );
    }
  }
}
