import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { registerSchema, loginSchema } from './auth.dto';

const router = Router();
const controller = new AuthController();

// Rutas públicas (sin middleware authenticate)
router.post('/register', validateRequest({ body: registerSchema }), controller.register);
router.post('/login', validateRequest({ body: loginSchema }), controller.login);

export default router;
