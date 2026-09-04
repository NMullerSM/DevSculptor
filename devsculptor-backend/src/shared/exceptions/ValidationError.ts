import { AppError, ErrorDetail } from './AppError';

export class ValidationError extends AppError {
  constructor(message: string = 'Los datos proporcionados no son válidos.', details: ErrorDetail[] = []) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}
