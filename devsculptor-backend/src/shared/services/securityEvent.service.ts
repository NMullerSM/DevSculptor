import { getPool } from '../../config/database';
import { logger } from '../../config/logger';

export interface RecordSecurityEventParams {
  userId?: string | null;
  eventType: string;
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
