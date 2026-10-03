import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { authenticate } from '../../middlewares/authenticate';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  mfaEnableSchema,
  mfaVerifySchema,
} from './auth.dto';

const router = Router();
const controller = new AuthController();

// Rutas públicas de autenticación
router.post('/register', validateRequest({ body: registerSchema }), controller.register);
router.post('/login', validateRequest({ body: loginSchema }), controller.login);
router.post('/forgot-password', validateRequest({ body: forgotPasswordSchema }), controller.forgotPassword);
router.post('/reset-password', validateRequest({ body: resetPasswordSchema }), controller.resetPassword);
router.post('/mfa/verify', validateRequest({ body: mfaVerifySchema }), controller.verifyMfaLogin);

// Rutas autenticadas de gestión de 2FA / MFA y perfil
router.post('/mfa/setup', authenticate, controller.setupMfa);
router.post('/mfa/enable', authenticate, validateRequest({ body: mfaEnableSchema }), controller.enableMfa);
router.post('/mfa/disable', authenticate, controller.disableMfa);
router.put('/profile', authenticate, controller.updateProfile);
router.put('/change-password', authenticate, controller.changePassword);

export default router;
