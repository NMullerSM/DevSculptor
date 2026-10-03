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

  private getOverride(req: Request) {
    const apiKey = (req.headers['x-user-ai-key'] as string) || undefined;
    const provider = (req.headers['x-user-ai-provider'] as string) || undefined;
    const model = (req.headers['x-user-ai-model'] as string) || undefined;
    const baseUrl = (req.headers['x-user-ai-endpoint'] as string) || undefined;

    if (!apiKey || apiKey.trim().length === 0) return undefined;
    return { apiKey: apiKey.trim(), provider, model, baseUrl };
  }

  chat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const { projectId } = req.params;
      const override = this.getOverride(req);
      const result = await this.aiService.chat(userId, projectId, req.body as ChatRequestDto, override);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  analyzeSchema = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const { projectId } = req.params;
      const override = this.getOverride(req);
      const result = await this.aiService.analyzeSchema(userId, projectId, override);
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
      const override = this.getOverride(req);
      const result = await this.aiService.suggestRequirements(userId, projectId, prompt, override);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  ping = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.getUserId(req);
      const override = this.getOverride(req);
      const result = await this.aiService.ping(override);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };
}
