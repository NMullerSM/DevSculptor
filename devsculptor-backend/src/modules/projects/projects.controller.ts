import { Request, Response, NextFunction } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './projects.dto';
import { sendSuccess, sendCreated } from '../../shared/responses/apiResponse';
import { UnauthorizedError } from '../../shared/exceptions/UnauthorizedError';

export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService = new ProjectsService()) {}

  private getUserId(req: Request): string {
    if (!req.user?.id) {
      throw new UnauthorizedError('Usuario no autenticado');
    }
    return req.user.id;
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const project = await this.projectsService.create(userId, req.body as CreateProjectDto);
      sendCreated(res, project);
    } catch (error) {
      next(error);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const offset = req.query.offset ? Number(req.query.offset) : undefined;

      const result = await this.projectsService.findAll(userId, { limit, offset });
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const project = await this.projectsService.findById(userId, req.params.projectId);
      sendSuccess(res, project, 200);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const project = await this.projectsService.update(
        userId,
        req.params.projectId,
        req.body as UpdateProjectDto
      );
      sendSuccess(res, project, 200);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      await this.projectsService.delete(userId, req.params.projectId);
      sendSuccess(res, { message: 'Proyecto eliminado exitosamente.' }, 200);
    } catch (error) {
      next(error);
    }
  };
}
