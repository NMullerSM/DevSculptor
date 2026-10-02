import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  MfaEnableDto,
  MfaVerifyDto,
} from './auth.dto';
import { sendCreated, sendSuccess } from '../../shared/responses/apiResponse';

export class AuthController {
  constructor(private readonly authService: AuthService = new AuthService()) {}

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
      const result = await this.authService.login(req.body as LoginDto);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.forgotPassword(req.body as ForgotPasswordDto);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.resetPassword(req.body as ResetPasswordDto);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  setupMfa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        return;
      }
      const result = await this.authService.setupMfa(userId);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  enableMfa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        return;
      }
      const result = await this.authService.enableMfa(userId, req.body as MfaEnableDto);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  verifyMfaLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.verifyMfaLogin(req.body as MfaVerifyDto);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  disableMfa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        return;
      }
      const code = req.body?.code;
      const result = await this.authService.disableMfa(userId, code);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };
}
