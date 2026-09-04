import { createApp } from './app';
import { env } from './config/env';
import { testConnection, closePool } from './config/database';
import { logger } from './config/logger';
import http from 'http';

async function bootstrap() {
  logger.info('Iniciando DevSculptor Backend Core...');

  // 1. Probar conectividad con PostgreSQL
  const dbConnected = await testConnection();
  if (!dbConnected) {
    logger.warn(
      'La base de datos PostgreSQL no respondió en el arranque. El servidor iniciará, pero las operaciones a base de datos pueden fallar hasta que esté disponible.'
    );
  }

  // 2. Crear instancia de Express
  const app = createApp();

  // 3. Levantar servidor HTTP
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        env: env.NODE_ENV,
        healthCheck: `http://localhost:${env.PORT}/api/v1/health`,
      },
      `🚀 Servidor DevSculptor iniciado exitosamente en el puerto ${env.PORT}`
    );
  });

  // 4. Cierre controlado (Graceful Shutdown)
  const shutdown = async (signal: string) => {
    logger.info(`Señal ${signal} recibida. Iniciando apagado controlado...`);

    server.close(async () => {
      logger.info('Servidor HTTP cerrado.');
      try {
        await closePool();
        logger.info('Conexiones a base de datos liberadas.');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error durante el cierre de conexiones');
        process.exit(1);
      }
    });

    // Forzar apagado si excede los 10 segundos
    setTimeout(() => {
      logger.fatal('El proceso de apagado excedió el tiempo límite. Forzando salida.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Error fatal durante el arranque del servidor');
  process.exit(1);
});
