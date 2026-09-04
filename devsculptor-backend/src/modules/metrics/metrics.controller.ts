import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';
import { sendSuccess } from '../../shared/responses/apiResponse';
import { UnauthorizedError } from '../../shared/exceptions/UnauthorizedError';

export class MetricsController {
  constructor(private readonly metricsService: MetricsService = new MetricsService()) {}

  getProjectMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedError('Usuario no autenticado');
      }

      const metrics = await this.metricsService.getProjectMetrics(
        req.user.id,
        req.params.projectId
      );
      sendSuccess(res, metrics, 200);
    } catch (error) {
      next(error);
    }
  };
}
