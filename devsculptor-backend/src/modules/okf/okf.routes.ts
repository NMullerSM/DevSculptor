import { Router } from 'express';
import { OkfController } from './okf.controller';
import { authenticate } from '../../middlewares/authenticate';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  syncVaultSchema,
  convertDocumentSchema,
  aiConvertDocumentSchema,
  queryOkfDocsSchema,
  verifyDocumentSchema,
} from './okf.dto';
import { projectIdParamSchema } from '../projects/projects.dto';

const router = Router({ mergeParams: true });
const controller = new OkfController();

// Todas las rutas de OKF requieren autenticación JWT
router.use(authenticate);

// Sincronizar en lote la bóveda documental con la base de datos
router.post(
  '/sync',
  validateRequest({ params: projectIdParamSchema, body: syncVaultSchema }),
  controller.syncVault
);

// Conversión mecánica de documento / paper a formato OKF
router.post(
  '/convert',
  validateRequest({ params: projectIdParamSchema, body: convertDocumentSchema }),
  controller.convertMechanically
);

// Conversión inteligente asistida por IA con extracción ontológica de tags
router.post(
  '/ai-convert',
  validateRequest({ params: projectIdParamSchema, body: aiConvertDocumentSchema }),
  controller.convertWithAi
);

// Listar documentos de la bóveda del proyecto con filtros por tipo, tag, búsqueda
router.get(
  '/',
  validateRequest({ params: projectIdParamSchema, query: queryOkfDocsSchema }),
  controller.getDocuments
);

// Estadísticas de frescura de la bóveda
router.get(
  '/stats',
  validateRequest({ params: projectIdParamSchema }),
  controller.getStats
);

// Verificación / certificación formal del documento por el arquitecto
router.patch(
  '/verify',
  validateRequest({ params: projectIdParamSchema, body: verifyDocumentSchema }),
  controller.verifyDocument
);

export default router;
