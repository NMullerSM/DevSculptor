import { AppError } from './AppError';

export class ExternalServiceError extends AppError {
  constructor(
    message: string = 'El servicio externo de Inteligencia Artificial no respondió satisfactoriamente.',
    options?: { cause?: unknown }
  ) {
    super(message, 502, 'UPSTREAM_AI_ERROR', [], options);
  }
}
