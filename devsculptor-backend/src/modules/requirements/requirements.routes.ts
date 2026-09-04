import { Router } from 'express';
import { RequirementsController } from './requirements.controller';
import { authenticate } from '../../middlewares/authenticate';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createRequirementSchema,
  updateRequirementSchema,
  projectAndRequirementParamsSchema,
  listRequirementsQuerySchema,
} from './requirements.dto';
import { projectIdParamSchema } from '../projects/projects.dto';

const router = Router({ mergeParams: true });
const controller = new RequirementsController();

router.use(authenticate);

router.post(
  '/',
  validateRequest({ params: projectIdParamSchema, body: createRequirementSchema }),
  controller.create
);

router.get(
  '/',
  validateRequest({ params: projectIdParamSchema, query: listRequirementsQuerySchema }),
  controller.findAll
);

router.get(
  '/:requirementId',
  validateRequest({ params: projectAndRequirementParamsSchema }),
  controller.findById
);

router.put(
  '/:requirementId',
  validateRequest({
    params: projectAndRequirementParamsSchema,
    body: updateRequirementSchema,
  }),
  controller.update
);

router.delete(
  '/:requirementId',
  validateRequest({ params: projectAndRequirementParamsSchema }),
  controller.delete
);

export default router;
