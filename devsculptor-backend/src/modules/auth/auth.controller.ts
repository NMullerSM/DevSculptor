import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  MfaEnableDto,
  MfaVerifyDto,
  DisableMfaDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './auth.dto';
import { sendCreated, sendSuccess } from '../../shared/responses/apiResponse';
import { UnauthorizedError } from '../../shared/exceptions/UnauthorizedError';
import { RequestContext } from '../../shared/services/securityEvent.service';

export class AuthController {
  constructor(private readonly authService: AuthService = new AuthService()) {}

  private getAuthUserId(req: Request): string {
    if (!req.user?.id) {
      throw new UnauthorizedError('Usuario no autenticado.');
    }
    return req.user.id;
  }

  private getRequestContext(req: Request): RequestContext {
    return {
      ip: req.ip ?? null,
      userAgent: req.get('user-agent')?.slice(0, 255) ?? null,
    };
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.register(req.body as RegisterDto);
      sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.login(req.body as LoginDto, this.getRequestContext(req));
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.forgotPassword(
        req.body as ForgotPasswordDto,
        this.getRequestContext(req)
      );
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.resetPassword(
        req.body as ResetPasswordDto,
        this.getRequestContext(req)
      );
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  setupMfa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getAuthUserId(req);
      const result = await this.authService.setupMfa(userId);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  enableMfa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getAuthUserId(req);
      const result = await this.authService.enableMfa(
        userId,
        req.body as MfaEnableDto,
        this.getRequestContext(req)
      );
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  verifyMfaLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.verifyMfaLogin(
        req.body as MfaVerifyDto,
        this.getRequestContext(req)
      );
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  disableMfa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getAuthUserId(req);
      const result = await this.authService.disableMfa(
        userId,
        req.body as DisableMfaDto,
        this.getRequestContext(req)
      );
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getAuthUserId(req);
      const dto = req.body as UpdateProfileDto;
      const result = await this.authService.updateProfile(userId, dto.full_name);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getAuthUserId(req);
      const result = await this.authService.changePassword(
        userId,
        req.body as ChangePasswordDto,
        this.getRequestContext(req)
      );
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };
}
