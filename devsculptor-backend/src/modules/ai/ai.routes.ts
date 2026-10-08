import { Router } from 'express';
import { AiController } from './ai.controller';
import { authenticate } from '../../middlewares/authenticate';
import { validateRequest } from '../../middlewares/validateRequest';
import { aiLimiter } from '../../middlewares/rateLimiter';
import { projectIdParamSchema } from '../projects/projects.dto';
import {
  chatRequestDtoSchema,
  analyzeSchemaRequestDtoSchema,
  suggestRequirementsRequestDtoSchema,
} from './ai.dto';

const aiRouter = Router({ mergeParams: true });
const controller = new AiController();

// Protección mediante JWT y control de cuotas/rate limit de IA
aiRouter.use(authenticate, aiLimiter);

// 1. Chat interactivo con el consultor de arquitectura
aiRouter.post(
  '/chat',
  validateRequest({ params: projectIdParamSchema, body: chatRequestDtoSchema }),
  controller.chat
);

// 2. Auditoría heurística/IA del modelo relacional
aiRouter.post(
  '/analyze-schema',
  validateRequest({ params: projectIdParamSchema, body: analyzeSchemaRequestDtoSchema }),
  controller.analyzeSchema
);

// 3. Extracción de requisitos formales IEEE-830
aiRouter.post(
  '/suggest-requirements',
  validateRequest({ params: projectIdParamSchema, body: suggestRequirementsRequestDtoSchema }),
  controller.suggestRequirements
);

// 4. Verificación de conectividad y latencia (Ping Test para BYOK)
aiRouter.post(
  '/ping',
  validateRequest({ params: projectIdParamSchema }),
  controller.ping
);

export default aiRouter;
