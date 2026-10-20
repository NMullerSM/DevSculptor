import { Request, Response, NextFunction } from 'express';
import { BenchmarkService } from './benchmark.service';
import { sendSuccess } from '../../shared/responses/apiResponse';
import { ForbiddenError } from '../../shared/exceptions';
import { env } from '../../config/env';

const benchmarkService = new BenchmarkService();

/**
 * Validador de Acceso Interno y No Público:
 * Protege el harness de benchmark de accesos públicos externos.
 */
function verifyInternalAccess(req: Request) {
  const internalKey = req.headers['x-devsculptor-internal-key'];
  if (internalKey && internalKey === env.JWT_SECRET) {
    return true;
  }

  // Si está autenticado mediante JWT y posee rol administrativo
  const user = (req as Request & { user?: { role?: string } }).user;
  if (user && (user.role === 'SUPERADMIN' || user.role === 'ADMIN')) {
    return true;
  }

  // En entorno local de desarrollo o test, permitir si viene de localhost
  const ip = req.ip || req.socket.remoteAddress;
  if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
      return true;
    }
  }

  throw new ForbiddenError(
    'Acceso denegado: El endpoint de Benchmark y Evaluación de Afinidad es estrictamente interno y no público.'
  );
}

export class BenchmarkController {
  public async runBenchmark(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      verifyInternalAccess(req);

      const summary = await benchmarkService.runBenchmarkSuite(req.body);
      sendSuccess(res, summary, 200);
    } catch (err) {
      next(err);
    }
  }

  public async listScenarios(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      verifyInternalAccess(req);

      const scenarios = benchmarkService.listScenarios();
      sendSuccess(res, { scenarios }, 200);
    } catch (err) {
      next(err);
    }
  }
}
