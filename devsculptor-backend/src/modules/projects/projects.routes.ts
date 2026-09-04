import { Router } from 'express';
import { ProjectsController } from './projects.controller';
import { authenticate } from '../../middlewares/authenticate';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
  paginationQuerySchema,
} from './projects.dto';

const router = Router();
const controller = new ProjectsController();

// Todas las rutas de proyectos son privadas (requieren JWT)
router.use(authenticate);

router.post('/', validateRequest({ body: createProjectSchema }), controller.create);
router.get('/', validateRequest({ query: paginationQuerySchema }), controller.findAll);
router.get('/:projectId', validateRequest({ params: projectIdParamSchema }), controller.findById);
router.put(
  '/:projectId',
  validateRequest({ params: projectIdParamSchema, body: updateProjectSchema }),
  controller.update
);
router.delete('/:projectId', validateRequest({ params: projectIdParamSchema }), controller.delete);

export default router;
