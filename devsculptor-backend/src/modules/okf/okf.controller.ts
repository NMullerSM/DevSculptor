import { Request, Response, NextFunction } from 'express';
import { OkfService } from './okf.service';
import {
  SyncVaultDto,
  ConvertDocumentDto,
  AiConvertDocumentDto,
  QueryOkfDocsDto,
  VerifyDocumentDto,
} from './okf.dto';
import { sendCreated, sendSuccess } from '../../shared/responses/apiResponse';
import { UnauthorizedError } from '../../shared/exceptions/UnauthorizedError';

export class OkfController {
  constructor(private readonly okfService: OkfService = new OkfService()) {}

  private getUserId(req: Request): string {
    if (!req.user?.id) {
      throw new UnauthorizedError('Usuario no autenticado');
    }
    return req.user.id;
  }

  syncVault = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const result = await this.okfService.syncVault(
        userId,
        req.params.projectId,
        req.body as SyncVaultDto
      );
      sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  };

  convertMechanically = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const result = await this.okfService.convertMechanically(
        userId,
        req.params.projectId,
        req.body as ConvertDocumentDto
      );
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  convertWithAi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const result = await this.okfService.convertWithAi(
        userId,
        req.params.projectId,
        req.body as AiConvertDocumentDto
      );
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  getDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const query = req.query as unknown as QueryOkfDocsDto;
      const documents = await this.okfService.getDocuments(userId, req.params.projectId, query);
      sendSuccess(res, documents, 200);
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const stats = await this.okfService.getVaultStats(userId, req.params.projectId);
      sendSuccess(res, stats, 200);
    } catch (error) {
      next(error);
    }
  };

  verifyDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const result = await this.okfService.verifyDocument(
        userId,
        req.params.projectId,
        req.body as VerifyDocumentDto
      );
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };
}
