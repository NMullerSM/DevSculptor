import { getPool, closePool } from '../config/database';
import { logger } from '../config/logger';

async function bootstrapSuperadmin(): Promise<void> {
  const emailArg =
    process.argv.find((a) => a.startsWith('--email='))?.split('=')[1] ||
    (process.argv.includes('--email') ? process.argv[process.argv.indexOf('--email') + 1] : undefined) ||
    process.env.BOOTSTRAP_SUPERADMIN_EMAIL;

  if (!emailArg || !emailArg.trim()) {
    logger.error('Debes proporcionar el email del usuario existente: --email <email> o variable BOOTSTRAP_SUPERADMIN_EMAIL');
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();
  const pool = getPool();

  try {
    const check = await pool.query('SELECT id, email, role FROM users WHERE LOWER(email) = $1', [email]);
    if (check.rowCount === 0) {
      logger.error({ email }, 'El usuario especificado no existe en la base de datos. Debe registrarse previamente.');
      process.exit(1);
    }

    const updated = await pool.query(
      "UPDATE users SET role = 'SUPERADMIN', updated_at = CURRENT_TIMESTAMP WHERE LOWER(email) = $1 RETURNING id, email, role",
      [email]
    );

    logger.info(
      { user: updated.rows[0] },
      'Usuario promovido formalmente al rol SUPERADMIN bajo directivas de gobernanza'
    );
  } catch (err) {
    logger.error({ err }, 'Fallo al promover usuario a SUPERADMIN');
    process.exit(1);
  } finally {
    await closePool();
  }
}

bootstrapSuperadmin().catch((err) => {
  logger.fatal({ err }, 'Fallo no controlado en bootstrapSuperadmin');
  process.exit(1);
});
