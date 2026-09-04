import { AppError } from './AppError';

export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(`${resource} no encontrado.`, 404, 'RESOURCE_NOT_FOUND');
  }
}
