import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../shared/exceptions/UnauthorizedError';
import { verifyToken } from '../shared/utils/jwt';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token de autenticación requerido. Formato: Bearer <token>'));
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    return next(new UnauthorizedError('Token de autenticación vacío'));
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.id,
      email: payload.email,
    };
    next();
  } catch (error) {
    next(error);
  }
}
