import { Pool } from 'pg';
import { env } from './env';
import { logger } from './logger';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      ssl: env.DB_SSL ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err: Error) => {
      logger.error({ err }, 'Error inesperado en cliente inactivo del pool de PostgreSQL');
    });
  }

  return pool;
}

export async function testConnection(): Promise<boolean> {
  const currentPool = getPool();
  try {
    const res = await currentPool.query('SELECT NOW() AS current_time');
    logger.info(
      { currentTime: res.rows[0].current_time },
      'Conexión a PostgreSQL establecida exitosamente'
    );
    return true;
  } catch (err) {
    logger.error({ err }, 'Fallo al conectar con la base de datos PostgreSQL');
    return false;
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    logger.info('Cerrando pool de conexiones de PostgreSQL...');
    await pool.end();
    pool = null;
    logger.info('Pool de PostgreSQL cerrado correctamente');
  }
}
