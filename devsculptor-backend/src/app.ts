import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { getPool } from './config/database';
import { requestId } from './middlewares/requestId';
import { requestLogger } from './middlewares/requestLogger';
import { rateLimiter } from './middlewares/rateLimiter';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { errorHandler } from './middlewares/errorHandler';
import { sendSuccess } from './shared/responses/apiResponse';
import { ForbiddenError } from './shared/exceptions';

// Importación de rutas de módulos
import authRoutes from './modules/auth/auth.routes';
import projectsRoutes from './modules/projects/projects.routes';
import requirementsRoutes from './modules/requirements/requirements.routes';
import { canvasRouter, auditLogsRouter } from './modules/canvas/canvas.routes';
import decisionsRoutes from './modules/decisions/decisions.routes';
import metricsRoutes from './modules/metrics/metrics.routes';
import aiRoutes from './modules/ai/ai.routes';
import okfRoutes from './modules/okf/okf.routes';
import adminRoutes from './modules/admin/admin.routes';

export function createApp(): Express {
  const app = express();

  // 0. Configuración de reverse proxy confiable para lectura precisa de IP y headers de rate limiting
  app.set('trust proxy', env.TRUST_PROXY_HOPS);

  // 1. Headers de seguridad con Helmet
  app.use(helmet());

  // 2. Control de CORS con whitelist desde variables de entorno y soporte localhost en desarrollo
  const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Permitir solicitudes sin origin (como Postman o curl) o si está en la whitelist
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          allowedOrigins.includes('*') ||
          (env.NODE_ENV === 'development' &&
            /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|100\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin))
        ) {
          callback(null, true);
        } else {
          callback(new ForbiddenError('Bloqueado por política CORS'));
        }
      },
      credentials: true,
    })
  );

  // 3. Rate limiting contra abusos y DoS
  app.use(rateLimiter);

  // 4. Parser de JSON con límite de tamaño
  app.use(express.json({ limit: '1mb' }));

  // 5. Generación y propagación de Request ID
  app.use(requestId);

  // 6. Logging estructurado HTTP con Pino
  app.use(requestLogger);

  // 7. Ruta Raíz y Health Check (públicas)
  app.get('/', (_req: Request, res: Response) => {
    sendSuccess(res, {
      name: 'DevSculptor Core API',
      version: '1.0.0',
      status: 'online',
      healthCheck: '/api/v1/health',
      readyCheck: '/api/v1/health/ready',
    });
  });

  app.get('/api/v1/health', (_req: Request, res: Response) => {
    sendSuccess(res, {
      status: 'ok',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/v1/health/ready', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const pool = getPool();
      await pool.query('SELECT 1');
      sendSuccess(res, {
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  });

  // 8. Rutas públicas de Autenticación
  app.use('/api/v1/auth', authRoutes);

  // 9. Rutas de Dominio Protegidas
  app.use('/api/v1/projects', projectsRoutes);
  app.use('/api/v1/projects/:projectId/requirements', requirementsRoutes);
  app.use('/api/v1/projects/:projectId/canvas', canvasRouter);
  app.use('/api/v1/projects/:projectId/audit-logs', auditLogsRouter);
  app.use('/api/v1/projects/:projectId/decisions', decisionsRoutes);
  app.use('/api/v1/projects/:projectId/metrics', metricsRoutes);
  app.use('/api/v1/projects/:projectId/ai', aiRoutes);
  app.use('/api/v1/projects/:projectId/okf', okfRoutes);

  // 10. Rutas de Administrador Maestro (Protegidas por RBAC SUPERADMIN)
  app.use('/api/v1/admin', adminRoutes);

  // 11. Manejador de rutas no encontradas (404)
  app.use(notFoundHandler);

  // 11. Manejador centralizado de errores con sanitización (500, PG errors, etc.)
  app.use(errorHandler);

  return app;
}

export default createApp;
