import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UnauthorizedError } from '../exceptions/UnauthorizedError';
import { UserRole } from '../types/express';

export type TokenType = 'access' | 'mfa_pending';

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
  typ: TokenType;
  tv: number;
}

export function signToken(
  payload: { id: string; email: string; role: UserRole; tv?: number },
  typ: TokenType = 'access',
  expiresIn?: string | number
): string {
  const expiresInOption = (
    typ === 'mfa_pending' ? '5m' : expiresIn || env.JWT_EXPIRES_IN
  ) as jwt.SignOptions['expiresIn'];

  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      typ,
      tv: payload.tv ?? 0,
    },
    env.JWT_SECRET,
    {
      algorithm: 'HS256',
      issuer: 'devsculptor',
      audience: 'devsculptor-api',
      expiresIn: expiresInOption,
    }
  );
}

export function verifyToken(token: string, expectedTyp: TokenType = 'access'): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'devsculptor',
      audience: 'devsculptor-api',
    }) as TokenPayload;

    if (!decoded.id || !decoded.email || !decoded.role) {
      throw new UnauthorizedError('Token malformado o payload inválido');
    }

    if (decoded.typ !== expectedTyp) {
      throw new UnauthorizedError(
        expectedTyp === 'access'
          ? 'Token de sesión temporal no autorizado como token de acceso.'
          : 'Token de acceso no válido para verificación 2FA.'
      );
    }

    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      typ: decoded.typ,
      tv: typeof decoded.tv === 'number' ? decoded.tv : 0,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError('Token inválido o expirado');
  }
}
