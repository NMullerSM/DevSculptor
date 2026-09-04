import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
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
}
