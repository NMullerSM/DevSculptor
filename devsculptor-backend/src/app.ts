import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { requestId } from './middlewares/requestId';
import { requestLogger } from './middlewares/requestLogger';
import { rateLimiter } from './middlewares/rateLimiter';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { errorHandler } from './middlewares/errorHandler';

// Importación de rutas de módulos
import authRoutes from './modules/auth/auth.routes';
import projectsRoutes from './modules/projects/projects.routes';
import requirementsRoutes from './modules/requirements/requirements.routes';
import { canvasRouter, auditLogsRouter } from './modules/canvas/canvas.routes';
import decisionsRoutes from './modules/decisions/decisions.routes';
import metricsRoutes from './modules/metrics/metrics.routes';
import aiRoutes from './modules/ai/ai.routes';

export function createApp(): Express {
  const app = express();

  // 1. Headers de seguridad con Helmet
  app.use(helmet());

  // 2. Control de CORS con whitelist desde variables de entorno
  const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Permitir solicitudes sin origin (como Postman o curl) o si está en la whitelist
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error('Bloqueado por política CORS'));
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

  // 7. Ruta de Health Check (pública, sin auth ni logging excesivo)
  app.get('/api/v1/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
    });
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

  // 10. Manejador de rutas no encontradas (404)
  app.use(notFoundHandler);

  // 11. Manejador centralizado de errores con sanitización (500, PG errors, etc.)
  app.use(errorHandler);

  return app;
}

export default createApp;
