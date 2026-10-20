import { Router } from 'express';
import { BenchmarkController } from './benchmark.controller';

const router = Router();
const controller = new BenchmarkController();

router.get('/scenarios', (req, res, next) => controller.listScenarios(req, res, next));
router.post('/evaluate', (req, res, next) => controller.runBenchmark(req, res, next));

export default router;
