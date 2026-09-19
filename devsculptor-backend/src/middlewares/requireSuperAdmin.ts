import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../shared/exceptions/NotFoundError';

/**
 * Middleware de Gobernanza Maestra (Pilar 7: Menor Privilegio y Fail-Safe Defaults)
 * Si el usuario no cuenta con rol SUPERADMIN, responde intencionalmente con HTTP 404 (Not Found)
 * para mitigar ataques de reconocimiento o enumeración de endpoints administrativos.
 */
export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'SUPERADMIN') {
    return next(new NotFoundError('Ruta'));
  }
  next();
}
