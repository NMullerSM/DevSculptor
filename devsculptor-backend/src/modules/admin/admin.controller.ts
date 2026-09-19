import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import {
  saveVaultFileSchema,
  createVaultFileSchema,
  updateUserRoleSchema,
  queryAuditLogsSchema,
} from './admin.schemas';
import { sendSuccess, sendCreated } from '../../shared/responses/apiResponse';

export class AdminController {
  constructor(private readonly adminService: AdminService = new AdminService()) {}

  getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.adminService.getPlatformStats();
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  };

  getUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await this.adminService.listUsers();
      sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  };

  updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { role } = updateUserRoleSchema.parse(req.body);
      const actorId = req.user!.id;

      const updated = await this.adminService.updateUserRole(id, role, actorId);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  };

  getGlobalVaultFiles = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = await this.adminService.listGlobalVaultFiles();
      sendSuccess(res, files);
    } catch (error) {
      next(error);
    }
  };

  getVaultFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pathParam = req.query.path as string;
      if (!pathParam) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'El parámetro ?path es requerido', details: [] },
        });
        return;
      }
      const file = await this.adminService.readVaultFile(pathParam);
      sendSuccess(res, file);
    } catch (error) {
      next(error);
    }
  };

  saveVaultFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { path, content, description } = saveVaultFileSchema.parse(req.body);
      const author = req.user?.email ? `Master Admin (${req.user.email})` : undefined;

      const file = await this.adminService.saveVaultFile(path, content, description, author);
      sendSuccess(res, file);
    } catch (error) {
      next(error);
    }
  };

  createVaultFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { path, content, category, description } = createVaultFileSchema.parse(req.body);
      const author = req.user?.email ? `Master Admin (${req.user.email})` : undefined;

      const file = await this.adminService.createVaultFile(
        path,
        content,
        category as 'templates' | 'skills' | 'rules' | 'archetypes',
        undefined,
        description,
        author
      );
      sendSuccess(res, file, 201);
    } catch (error) {
      next(error);
    }
  };

  deleteVaultFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pathParam = req.query.path as string;
      if (!pathParam) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'El parámetro ?path es requerido', details: [] },
        });
        return;
      }
      await this.adminService.deleteVaultFile(pathParam);
      sendSuccess(res, { deleted: true, path: pathParam });
    } catch (error) {
      next(error);
    }
  };

  getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = queryAuditLogsSchema.parse(req.query);
      const logs = await this.adminService.getGlobalAuditLogs(query.limit, query.offset, query.entity);
      sendSuccess(res, logs);
    } catch (error) {
      next(error);
    }
  };
}
