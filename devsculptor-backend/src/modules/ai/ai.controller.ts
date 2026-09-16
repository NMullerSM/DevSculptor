import { Request, Response, NextFunction } from 'express';
import { AiService } from './ai.service';
import { ChatRequestDto, SuggestRequirementsRequestDto } from './ai.dto';
import { sendSuccess } from '../../shared/responses/apiResponse';
import { UnauthorizedError } from '../../shared/exceptions/UnauthorizedError';

export class AiController {
  constructor(private readonly aiService: AiService = new AiService()) {}

  private getUserId(req: Request): string {
    if (!req.user?.id) {
      throw new UnauthorizedError('Usuario no autenticado');
    }
    return req.user.id;
  }

  chat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const { projectId } = req.params;
      const result = await this.aiService.chat(userId, projectId, req.body as ChatRequestDto);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  analyzeSchema = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const { projectId } = req.params;
      const result = await this.aiService.analyzeSchema(userId, projectId);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  suggestRequirements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const { projectId } = req.params;
      const { prompt } = req.body as SuggestRequirementsRequestDto;
      const result = await this.aiService.suggestRequirements(userId, projectId, prompt);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };
}
