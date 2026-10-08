import { Request, Response, NextFunction } from 'express';
import { AiService } from './ai.service';
import {
  ChatRequestDto,
  SuggestRequirementsRequestDto,
  userAiHeadersSchema,
} from './ai.dto';
import { sendSuccess } from '../../shared/responses/apiResponse';
import { UnauthorizedError } from '../../shared/exceptions/UnauthorizedError';
import { ValidationError } from '../../shared/exceptions/ValidationError';
import { assertSafeOutboundUrl } from '../../shared/utils/safeUrl';
import { env } from '../../config/env';

export class AiController {
  constructor(private readonly aiService: AiService = new AiService()) {}

  private getUserId(req: Request): string {
    if (!req.user?.id) {
      throw new UnauthorizedError('Usuario no autenticado');
    }
    return req.user.id;
  }

  private async getOverride(req: Request) {
    const rawKey = req.headers['x-user-ai-key'] as string | undefined;
    if (!rawKey || rawKey.trim().length === 0) return undefined;

    const parsed = userAiHeadersSchema.parse({
      apiKey: rawKey.trim(),
      provider: req.headers['x-user-ai-provider'],
      model: req.headers['x-user-ai-model'],
      endpoint: req.headers['x-user-ai-endpoint'],
    });

    let safeEndpoint: string | undefined = undefined;
    if (parsed.endpoint) {
      if (env.NODE_ENV === 'production' && !env.ALLOW_CUSTOM_AI_ENDPOINTS) {
        throw new ValidationError(
          'Endpoints personalizados de IA deshabilitados por políticas de seguridad.'
        );
      }
      const safeUrl = await assertSafeOutboundUrl(parsed.endpoint);
      safeEndpoint = safeUrl.toString().replace(/\/+$/, '');
    }

    return {
      apiKey: parsed.apiKey,
      provider: parsed.provider,
      model: parsed.model,
      baseUrl: safeEndpoint,
    };
  }

  chat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const { projectId } = req.params;
      const override = await this.getOverride(req);
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
      const override = await this.getOverride(req);
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
      const override = await this.getOverride(req);
      const result = await this.aiService.suggestRequirements(userId, projectId, prompt, override);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  ping = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.getUserId(req);
      const override = await this.getOverride(req);
      const result = await this.aiService.ping(override);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };
}
