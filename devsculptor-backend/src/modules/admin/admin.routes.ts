import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate } from '../../middlewares/authenticate';
import { requireSuperAdmin } from '../../middlewares/requireSuperAdmin';

const router = Router();
const controller = new AdminController();

// Todos los endpoints de este router requieren autenticación y rol SUPERADMIN (Fail-Safe 404)
router.use(authenticate, requireSuperAdmin);

// 1. Telemetría de la Plataforma
router.get('/stats', controller.getStats);

// 2. Gestión de Usuarios y Roles
router.get('/users', controller.getUsers);
router.patch('/users/:id/role', controller.updateUserRole);

// 3. Gestión y Editor In-Situ de la Bóveda Global (_global/)
router.get('/vault/global', controller.getGlobalVaultFiles);
router.get('/vault/file', controller.getVaultFile);
router.put('/vault/file', controller.saveVaultFile);
router.post('/vault/file', controller.createVaultFile);
router.delete('/vault/file', controller.deleteVaultFile);

// 4. Registro Transversal de Auditoría
router.get('/audit-logs', controller.getAuditLogs);

export default router;
