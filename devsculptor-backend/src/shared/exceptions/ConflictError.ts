import { AppError } from './AppError';

export class ConflictError extends AppError {
  constructor(message: string = 'Conflicto con un recurso existente.') {
    super(message, 409, 'CONFLICT');
  }
}
