import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../shared/exceptions/AppError';
import { ConflictError } from '../shared/exceptions/ConflictError';
import { ValidationError } from '../shared/exceptions/ValidationError';
import { ForbiddenError } from '../shared/exceptions/ForbiddenError';
import { sendError } from '../shared/responses/apiResponse';
import { logger } from '../config/logger';

interface DatabaseError extends Error {
  code?: string;
  detail?: string;
  table?: string;
  constraint?: string;
}

interface BodyParserError extends Error {
  type?: string;
  status?: number;
}

export function errorHandler(
  err: Error | AppError | DatabaseError | BodyParserError | ZodError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Error operacional conocido (AppError y subclases)
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId: req.requestId }, err.message);
    } else {
      logger.warn({ err, requestId: req.requestId }, err.message);
    }
    return sendError(res, err);
  }

  // 2. Errores de validación de Zod
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    logger.warn({ err: err.issues, requestId: req.requestId }, 'Error de validación Zod');
    const validation = new ValidationError('Los datos proporcionados no son válidos.', details);
    return sendError(res, validation);
  }

  // 3. Errores de parseo de Express Body Parser (JSON malformado o payload gigante)
  const bpErr = err as BodyParserError;
  if (bpErr.type === 'entity.parse.failed') {
    logger.warn({ err, requestId: req.requestId }, 'JSON de solicitud malformado');
    const validation = new ValidationError('El cuerpo de la solicitud no contiene un JSON válido.');
    return sendError(res, validation);
  }

  if (bpErr.type === 'entity.too.large') {
    logger.warn({ err, requestId: req.requestId }, 'Cuerpo de solicitud excede el límite');
    const payloadError = new AppError(
      'El tamaño del cuerpo de la solicitud excede el límite permitido (1MB).',
      413,
      'PAYLOAD_TOO_LARGE'
    );
    return sendError(res, payloadError);
  }

  // 4. Errores de política CORS
  if (err.message && err.message.toLowerCase().includes('cors')) {
    logger.warn({ err: err.message, requestId: req.requestId }, 'Petición rechazada por política CORS');
    const forbidden = new ForbiddenError('Origen no permitido por la política CORS.');
    return sendError(res, forbidden);
  }

  // 5. Mapeo seguro y sanitizado de códigos de PostgreSQL (sin filtración de details al cliente)
  const dbErr = err as DatabaseError;
  if (dbErr.code) {
    switch (dbErr.code) {
      case '23505': {
        // Unique violation
        logger.warn({ dbErr, requestId: req.requestId }, 'Conflicto de unicidad en base de datos');
        const conflict = new ConflictError('El recurso ya existe o presenta datos duplicados.');
        return sendError(res, conflict);
      }
      case '23503': {
        // Foreign key violation
        logger.warn({ dbErr, requestId: req.requestId }, 'Violación de clave foránea en base de datos');
        const validation = new ValidationError(
          'La entidad referenciada no existe o no puede modificarse/eliminarse por estar vinculada.'
        );
        return sendError(res, validation);
      }
      case '23502': {
        // Not null violation
        logger.warn({ dbErr, requestId: req.requestId }, 'Violación de campo no nulo en base de datos');
        const validation = new ValidationError('Un campo requerido no fue provisto en la persistencia.');
        return sendError(res, validation);
      }
      case '23514': {
        // Check constraint violation
        logger.warn({ dbErr, requestId: req.requestId }, 'Violación de restricción CHECK en base de datos');
        const validation = new ValidationError(
          'Los datos proporcionados no satisfacen las restricciones de dominio.'
        );
        return sendError(res, validation);
      }
      case '22P02': {
        // Invalid input syntax (e.g. invalid UUID format)
        logger.warn({ dbErr, requestId: req.requestId }, 'Sintaxis de entrada inválida (ej. UUID)');
        const validation = new ValidationError('Formato de identificador o dato inválido.');
        return sendError(res, validation);
      }
      case '40001':
      case '40P01': {
        // Concurrency conflict / Deadlock
        logger.warn({ dbErr, requestId: req.requestId }, 'Conflicto de serialización o concurrencia en base de datos');
        const retryError = new AppError(
          'Conflicto temporal de concurrencia en base de datos. Por favor reintente la operación.',
          503,
          'CONCURRENCY_CONFLICT'
        );
        return sendError(res, retryError);
      }
      case '57014': {
        // Query canceled / Statement timeout
        logger.error({ dbErr, requestId: req.requestId }, 'Tiempo límite de consulta SQL excedido');
        const timeoutError = new AppError(
          'La consulta a base de datos excedió el tiempo límite de espera.',
          504,
          'DATABASE_TIMEOUT'
        );
        return sendError(res, timeoutError);
      }
      default: {
        logger.error({ dbErr, requestId: req.requestId }, 'Error no manejado de base de datos');
        const internal = new AppError('Error interno en la base de datos.', 500, 'DATABASE_ERROR');
        return sendError(res, internal);
      }
    }
  }

  // 6. Error no controlado
  logger.error({ err, requestId: req.requestId }, 'Error no controlado en el servidor');
  const internalError = new AppError(
    'Ocurrió un error interno en el servidor.',
    500,
    'INTERNAL_SERVER_ERROR'
  );
  return sendError(res, internalError);
}
