import { AppError } from './AppError';

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acceso denegado o prohibido.') {
    super(message, 403, 'FORBIDDEN');
  }
}
