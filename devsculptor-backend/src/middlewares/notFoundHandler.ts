import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../shared/exceptions/NotFoundError';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Ruta ${req.method} ${req.originalUrl}`));
}
