import { Router } from 'express';
import { MetricsController } from './metrics.controller';
import { authenticate } from '../../middlewares/authenticate';
import { validateRequest } from '../../middlewares/validateRequest';
import { projectIdParamSchema } from '../projects/projects.dto';

const router = Router({ mergeParams: true });
const controller = new MetricsController();

router.use(authenticate);

router.get('/', validateRequest({ params: projectIdParamSchema }), controller.getProjectMetrics);

export default router;
