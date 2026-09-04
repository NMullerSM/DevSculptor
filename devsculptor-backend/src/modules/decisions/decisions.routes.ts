import { Router } from 'express';
import { DecisionsController } from './decisions.controller';
import { authenticate } from '../../middlewares/authenticate';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createDecisionSchema,
  updateDecisionSchema,
  updateDecisionStatusSchema,
  projectAndDecisionParamsSchema,
  listDecisionsQuerySchema,
} from './decisions.dto';
import { projectIdParamSchema } from '../projects/projects.dto';

const router = Router({ mergeParams: true });
const controller = new DecisionsController();

router.use(authenticate);

router.post(
  '/',
  validateRequest({ params: projectIdParamSchema, body: createDecisionSchema }),
  controller.create
);

router.get(
  '/',
  validateRequest({ params: projectIdParamSchema, query: listDecisionsQuerySchema }),
  controller.findAll
);

router.get(
  '/:decisionId',
  validateRequest({ params: projectAndDecisionParamsSchema }),
  controller.findById
);

router.put(
  '/:decisionId',
  validateRequest({
    params: projectAndDecisionParamsSchema,
    body: updateDecisionSchema,
  }),
  controller.update
);

router.patch(
  '/:decisionId/status',
  validateRequest({
    params: projectAndDecisionParamsSchema,
    body: updateDecisionStatusSchema,
  }),
  controller.updateStatus
);

router.delete(
  '/:decisionId',
  validateRequest({ params: projectAndDecisionParamsSchema }),
  controller.delete
);

export default router;
