import { Request, Response, NextFunction } from 'express';
import { RequirementsService } from './requirements.service';
import { CreateRequirementDto, UpdateRequirementDto } from './requirements.dto';
import { sendCreated, sendSuccess } from '../../shared/responses/apiResponse';
import { UnauthorizedError } from '../../shared/exceptions/UnauthorizedError';

export class RequirementsController {
  constructor(
    private readonly requirementsService: RequirementsService = new RequirementsService()
  ) {}

  private getUserId(req: Request): string {
    if (!req.user?.id) {
      throw new UnauthorizedError('Usuario no autenticado');
    }
    return req.user.id;
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const requirement = await this.requirementsService.create(
        userId,
        req.params.projectId,
        req.body as CreateRequirementDto
      );
      sendCreated(res, requirement);
    } catch (error) {
      next(error);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const type = req.query.type as 'RF' | 'RNF' | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const offset = req.query.offset ? Number(req.query.offset) : undefined;

      const result = await this.requirementsService.findAll(
        userId,
        req.params.projectId,
        type,
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
      const requirement = await this.requirementsService.findById(
        userId,
        req.params.projectId,
        req.params.requirementId
      );
      sendSuccess(res, requirement, 200);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const requirement = await this.requirementsService.update(
        userId,
        req.params.projectId,
        req.params.requirementId,
        req.body as UpdateRequirementDto
      );
      sendSuccess(res, requirement, 200);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      await this.requirementsService.delete(
        userId,
        req.params.projectId,
        req.params.requirementId
      );
      sendSuccess(res, { message: 'Requisito eliminado exitosamente.' }, 200);
    } catch (error) {
      next(error);
    }
  };
}
