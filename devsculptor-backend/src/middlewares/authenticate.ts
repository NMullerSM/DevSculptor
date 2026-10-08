import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../shared/exceptions/UnauthorizedError';
import { verifyToken } from '../shared/utils/jwt';
import { getPool } from '../config/database';
import { UserRole } from '../shared/types/express';

interface DbAuthUser {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  token_version: number;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token de autenticación requerido. Formato: Bearer <token>'));
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    return next(new UnauthorizedError('Token de autenticación vacío'));
  }

  try {
    // 1. Verificación criptográfica estricta (exige typ: 'access', issuer y audience)
    const payload = verifyToken(token, 'access');

    // 2. Validación de revocación inmediata y estado de la cuenta en base de datos (SEC-03)
    const pool = getPool();
    const query = `
      SELECT id, email, role, is_active, token_version 
      FROM users 
      WHERE id = $1;
    `;
    const result = await pool.query<DbAuthUser>(query, [payload.id]);
    const user = result.rows[0];

    if (!user) {
      throw new UnauthorizedError('Usuario no encontrado o sesión no válida.');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Esta cuenta se encuentra inactiva o ha sido suspendida.');
    }

    if (Number(user.token_version) !== Number(payload.tv)) {
      throw new UnauthorizedError('La sesión ha expirado o ha sido revocada tras un cambio de credenciales.');
    }

    // 3. Inyección en req.user con el rol verificado en tiempo real de la base de datos
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role || 'USER',
    };

    next();
  } catch (error) {
    next(error);
  }
}
