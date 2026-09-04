import { Request, Response, NextFunction } from 'express';
import { CanvasService } from './canvas.service';
import { CreateCanvasEntityDto, UpdateCanvasEntityDto } from './canvas.dto';
import { sendCreated, sendSuccess } from '../../shared/responses/apiResponse';
import { UnauthorizedError } from '../../shared/exceptions/UnauthorizedError';

export class CanvasController {
  constructor(private readonly canvasService: CanvasService = new CanvasService()) {}

  private getUserId(req: Request): string {
    if (!req.user?.id) {
      throw new UnauthorizedError('Usuario no autenticado');
    }
    return req.user.id;
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const entity = await this.canvasService.create(
        userId,
        req.params.projectId,
        req.body as CreateCanvasEntityDto
      );
      sendCreated(res, entity);
    } catch (error) {
      next(error);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const entities = await this.canvasService.findAll(userId, req.params.projectId);
      sendSuccess(res, entities, 200);
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const entity = await this.canvasService.findById(
        userId,
        req.params.projectId,
        req.params.canvasId
      );
      sendSuccess(res, entity, 200);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const entity = await this.canvasService.update(
        userId,
        req.params.projectId,
        req.params.canvasId,
        req.body as UpdateCanvasEntityDto
      );
      sendSuccess(res, entity, 200);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      await this.canvasService.delete(userId, req.params.projectId, req.params.canvasId);
      sendSuccess(res, { message: 'Entidad de canvas eliminada exitosamente.' }, 200);
    } catch (error) {
      next(error);
    }
  };

  getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const offset = req.query.offset ? Number(req.query.offset) : undefined;

      const logs = await this.canvasService.getAuditLogs(userId, req.params.projectId, {
        limit,
        offset,
      });
      sendSuccess(res, logs.data, 200, logs.meta);
    } catch (error) {
      next(error);
    }
  };
}
