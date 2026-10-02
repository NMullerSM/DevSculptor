import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UnauthorizedError } from '../exceptions/UnauthorizedError';

import { UserRole } from '../types/express';

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
}

export function signToken(payload: TokenPayload, expiresIn?: string | number): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: (expiresIn || env.JWT_EXPIRES_IN) as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    if (!decoded.id || !decoded.email) {
      throw new UnauthorizedError('Token malformado o payload inválido');
    }
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || 'USER',
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError('Token inválido o expirado');
  }
}
