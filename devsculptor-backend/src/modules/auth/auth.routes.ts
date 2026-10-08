import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { authenticate } from '../../middlewares/authenticate';
import {
  registerLimiter,
  loginLimiter,
  mfaLimiter,
  forgotPasswordLimiter,
} from '../../middlewares/rateLimiter';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  mfaEnableSchema,
  mfaVerifySchema,
  disableMfaSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './auth.dto';

const router = Router();
const controller = new AuthController();

// Rutas públicas de autenticación con rate limiting especializado
router.post(
  '/register',
  registerLimiter,
  validateRequest({ body: registerSchema }),
  controller.register
);

router.post(
  '/login',
  loginLimiter,
  validateRequest({ body: loginSchema }),
  controller.login
);

router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  controller.forgotPassword
);

router.post(
  '/reset-password',
  validateRequest({ body: resetPasswordSchema }),
  controller.resetPassword
);

router.post(
  '/mfa/verify',
  mfaLimiter,
  validateRequest({ body: mfaVerifySchema }),
  controller.verifyMfaLogin
);

// Rutas autenticadas de gestión de 2FA / MFA y perfil
router.post('/mfa/setup', authenticate, controller.setupMfa);

router.post(
  '/mfa/enable',
  authenticate,
  validateRequest({ body: mfaEnableSchema }),
  controller.enableMfa
);

router.post(
  '/mfa/disable',
  authenticate,
  validateRequest({ body: disableMfaSchema }),
  controller.disableMfa
);

router.put(
  '/profile',
  authenticate,
  validateRequest({ body: updateProfileSchema }),
  controller.updateProfile
);

router.put(
  '/change-password',
  authenticate,
  validateRequest({ body: changePasswordSchema }),
  controller.changePassword
);

export default router;
