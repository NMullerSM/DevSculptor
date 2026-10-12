import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '../config/env';

function buildRateLimitHandler(code: string, message: string) {
  return (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code,
        message,
        details: [],
      },
    });
  };
}

// 1. Limitador global de peticiones HTTP
export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: buildRateLimitHandler(
    'RATE_LIMIT_EXCEEDED',
    'Demasiadas peticiones desde esta IP. Intente nuevamente más tarde.'
  ),
});

// 2. Limitador contra fuerza bruta en Login (10 intentos / 15 min por IP + Email)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const email = (req.body?.email || '').trim().toLowerCase();
    return `${req.ip}_${email}`;
  },
  handler: buildRateLimitHandler(
    'TOO_MANY_LOGIN_ATTEMPTS',
    'Demasiados intentos de inicio de sesión. Por seguridad, intente nuevamente en 15 minutos.'
  ),
});

// 3. Limitador contra adivinación de códigos 2FA (5 intentos / 5 min por IP)
export const mfaLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: buildRateLimitHandler(
    'TOO_MANY_MFA_ATTEMPTS',
    'Demasiados intentos de verificación de código 2FA. Intente en 5 minutos.'
  ),
});

// 4. Limitador de recuperación de contraseña (5 solicitudes / hora por IP)
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: buildRateLimitHandler(
    'TOO_MANY_RESET_REQUESTS',
    'Demasiadas solicitudes de recuperación de contraseña. Intente en 1 hora.'
  ),
});

// 4b. Limitador de restablecimiento de contraseña (10 intentos / hora por IP) (H-03)
export const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: buildRateLimitHandler(
    'TOO_MANY_RESET_ATTEMPTS',
    'Demasiados intentos de restablecimiento de contraseña. Intente en 1 hora.'
  ),
});

// 5. Limitador de creación de cuentas (10 registros / hora por IP)
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: buildRateLimitHandler(
    'TOO_MANY_REGISTRATIONS',
    'Límite de registros alcanzado desde esta red. Intente más tarde.'
  ),
});

// 6. Limitador de cuotas de consultas de Inteligencia Artificial (30 / 15 min por usuario)
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.user?.id || req.ip || 'anonymous',
  handler: buildRateLimitHandler(
    'AI_RATE_LIMIT_EXCEEDED',
    'Ha alcanzado el límite de consultas de arquitectura con IA por ventana de tiempo. Espere unos minutos.'
  ),
});
