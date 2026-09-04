import { AppError } from './AppError';

export class UnauthorizedError extends AppError {
  constructor(message: string = 'No autorizado.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}
