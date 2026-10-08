import fs from 'fs';
import path from 'path';
import { getPool, closePool } from '../../config/database';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

async function runSeed() {
  if (env.NODE_ENV === 'production') {
    logger.fatal('El script de seeds de desarrollo está estrictamente prohibido en entorno de producción.');
    process.exit(1);
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    logger.info('Iniciando carga de datos semilla (seed)...');
    const seedFilePath = path.join(__dirname, 'seed_dev.sql');

    if (!fs.existsSync(seedFilePath)) {
      throw new Error(`Archivo de seed no encontrado: ${seedFilePath}`);
    }

    const sql = fs.readFileSync(seedFilePath, 'utf8');

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');

    logger.info('Datos semilla insertados exitosamente.');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err }, 'Error durante la ejecución del script seed');
    throw err;
  } finally {
    client.release();
    await closePool();
  }
}

runSeed().catch((err) => {
  logger.fatal({ err }, 'Fallo fatal en script de semillas');
  process.exit(1);
});
