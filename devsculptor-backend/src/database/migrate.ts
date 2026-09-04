import fs from 'fs';
import path from 'path';
import { getPool, closePool } from '../config/database';
import { logger } from '../config/logger';

async function runMigrations() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    logger.info('Iniciando proceso de migraciones...');

    // 1. Crear tabla de control si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Definir directorios en orden estricto de precedencia
    const baseDir = __dirname;
    const dirs = [
      path.join(baseDir, 'migrations'),
      path.join(baseDir, 'triggers'),
      path.join(baseDir, 'procedures'),
    ];

    const migrationFiles: { name: string; fullPath: string }[] = [];

    for (const dir of dirs) {
      if (fs.existsSync(dir)) {
        const files = fs
          .readdirSync(dir)
          .filter((f) => f.endsWith('.sql'))
          .sort();

        for (const file of files) {
          migrationFiles.push({
            name: file,
            fullPath: path.join(dir, file),
          });
        }
      }
    }

    logger.info(`Se encontraron ${migrationFiles.length} artefactos SQL`);

    for (const migration of migrationFiles) {
      // Verificar si ya fue ejecutada
      const checkRes = await client.query(
        'SELECT id FROM _migrations WHERE filename = $1',
        [migration.name]
      );

      if (checkRes.rows.length > 0) {
        logger.debug(`[SKIP] Migración ya ejecutada: ${migration.name}`);
        continue;
      }

      logger.info(`[RUN] Ejecutando migración: ${migration.name}...`);
      const sql = fs.readFileSync(migration.fullPath, 'utf8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [
          migration.name,
        ]);
        await client.query('COMMIT');
        logger.info(`[SUCCESS] Migración completada: ${migration.name}`);
      } catch (migrationError) {
        await client.query('ROLLBACK');
        logger.error(
          { err: migrationError, file: migration.name },
          `[FAIL] Error crítico ejecutando migración ${migration.name}`
        );
        throw migrationError;
      }
    }

    logger.info('Todas las migraciones fueron ejecutadas satisfactoriamente.');
  } finally {
    client.release();
    await closePool();
  }
}

runMigrations().catch((err) => {
  logger.fatal({ err }, 'Error fatal durante la ejecución de migraciones');
  process.exit(1);
});
