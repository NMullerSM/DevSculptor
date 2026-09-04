import { Router } from 'express';
import { CanvasController } from './canvas.controller';
import { authenticate } from '../../middlewares/authenticate';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createCanvasEntitySchema,
  updateCanvasEntitySchema,
  projectAndCanvasParamsSchema,
} from './canvas.dto';
import { projectIdParamSchema, paginationQuerySchema } from '../projects/projects.dto';

const canvasRouter = Router({ mergeParams: true });
const auditLogsRouter = Router({ mergeParams: true });
const controller = new CanvasController();

// Middlewares comunes
canvasRouter.use(authenticate);
auditLogsRouter.use(authenticate);

// Rutas de Canvas Entities
canvasRouter.post(
  '/',
  validateRequest({ params: projectIdParamSchema, body: createCanvasEntitySchema }),
  controller.create
);

canvasRouter.get(
  '/',
  validateRequest({ params: projectIdParamSchema }),
  controller.findAll
);

canvasRouter.get(
  '/:canvasId',
  validateRequest({ params: projectAndCanvasParamsSchema }),
  controller.findById
);

canvasRouter.put(
  '/:canvasId',
  validateRequest({
    params: projectAndCanvasParamsSchema,
    body: updateCanvasEntitySchema,
  }),
  controller.update
);

canvasRouter.delete(
  '/:canvasId',
  validateRequest({ params: projectAndCanvasParamsSchema }),
  controller.delete
);

// Ruta de Audit Logs (GET /api/v1/projects/:projectId/audit-logs)
auditLogsRouter.get(
  '/',
  validateRequest({ params: projectIdParamSchema, query: paginationQuerySchema }),
  controller.getAuditLogs
);

export { canvasRouter, auditLogsRouter };
export default canvasRouter;
