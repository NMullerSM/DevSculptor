import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/exceptions/AppError';
import { ConflictError } from '../shared/exceptions/ConflictError';
import { ValidationError } from '../shared/exceptions/ValidationError';
import { sendError } from '../shared/responses/apiResponse';
import { logger } from '../config/logger';

interface DatabaseError extends Error {
  code?: string;
  detail?: string;
  table?: string;
  constraint?: string;
}

export function errorHandler(
  err: Error | AppError | DatabaseError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // 1. Error operacional conocido (AppError)
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId: req.requestId }, err.message);
    } else {
      logger.warn({ err, requestId: req.requestId }, err.message);
    }
    return sendError(res, err);
  }

  // 2. Mapeo de errores conocidos de PostgreSQL
  const dbErr = err as DatabaseError;
  if (dbErr.code) {
    switch (dbErr.code) {
      case '23505': {
        // Unique violation
        const detail = dbErr.detail || 'Violación de restricción de unicidad';
        logger.warn({ dbErr, requestId: req.requestId }, `Conflicto de unicidad: ${detail}`);
        const conflict = new ConflictError(
          detail.includes('already exists') || detail.includes('ya existe')
            ? detail
            : 'El recurso ya existe o presenta datos duplicados.'
        );
        return sendError(res, conflict);
      }
      case '23503': {
        // Foreign key violation
        logger.warn({ dbErr, requestId: req.requestId }, 'Violación de clave foránea');
        const validation = new ValidationError(
          'La entidad referenciada no existe o no puede modificarse/eliminarse por estar vinculada.',
          dbErr.detail ? [{ message: dbErr.detail }] : []
        );
        return sendError(res, validation);
      }
      case '23502': {
        // Not null violation
        logger.warn({ dbErr, requestId: req.requestId }, 'Violación de campo no nulo');
        const validation = new ValidationError('Un campo requerido no fue provisto en la base de datos.');
        return sendError(res, validation);
      }
      case '22P02': {
        // Invalid input syntax (e.g. invalid UUID format)
        logger.warn({ dbErr, requestId: req.requestId }, 'Sintaxis de entrada inválida (ej. UUID)');
        const validation = new ValidationError('Formato de identificador o dato inválido.');
        return sendError(res, validation);
      }
      default: {
        logger.error({ dbErr, requestId: req.requestId }, 'Error no manejado de base de datos');
        const internal = new AppError('Error interno en la base de datos.', 500, 'DATABASE_ERROR');
        return sendError(res, internal);
      }
    }
  }

  // 3. Error no operacional o inesperado
  logger.error({ err, requestId: req.requestId }, 'Error no controlado en el servidor');
  const internalError = new AppError(
    'Ocurrió un error interno en el servidor.',
    500,
    'INTERNAL_SERVER_ERROR'
  );
  return sendError(res, internalError);
}
