import { Request, Response, NextFunction } from 'express';
import { DecisionsService } from './decisions.service';
import {
  CreateDecisionDto,
  UpdateDecisionDto,
  UpdateDecisionStatusDto,
  DecisionStatus,
} from './decisions.dto';
import { sendCreated, sendSuccess } from '../../shared/responses/apiResponse';
import { UnauthorizedError } from '../../shared/exceptions/UnauthorizedError';

export class DecisionsController {
  constructor(private readonly decisionsService: DecisionsService = new DecisionsService()) {}

  private getUserId(req: Request): string {
    if (!req.user?.id) {
      throw new UnauthorizedError('Usuario no autenticado');
    }
    return req.user.id;
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const decision = await this.decisionsService.create(
        userId,
        req.params.projectId,
        req.body as CreateDecisionDto
      );
      sendCreated(res, decision);
    } catch (error) {
      next(error);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const status = req.query.status as DecisionStatus | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const offset = req.query.offset ? Number(req.query.offset) : undefined;

      const result = await this.decisionsService.findAll(
        userId,
        req.params.projectId,
        status,
        { limit, offset }
      );
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const decision = await this.decisionsService.findById(
        userId,
        req.params.projectId,
        req.params.decisionId
      );
      sendSuccess(res, decision, 200);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const decision = await this.decisionsService.update(
        userId,
        req.params.projectId,
        req.params.decisionId,
        req.body as UpdateDecisionDto
      );
      sendSuccess(res, decision, 200);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const decision = await this.decisionsService.updateStatus(
        userId,
        req.params.projectId,
        req.params.decisionId,
        req.body as UpdateDecisionStatusDto
      );
      sendSuccess(res, decision, 200);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      await this.decisionsService.delete(
        userId,
        req.params.projectId,
        req.params.decisionId
      );
      sendSuccess(res, { message: 'Decisión de arquitectura eliminada exitosamente.' }, 200);
    } catch (error) {
      next(error);
    }
  };
}
