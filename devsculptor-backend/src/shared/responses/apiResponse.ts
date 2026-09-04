import { Response } from 'express';
import { PaginationMeta } from '../types/pagination';
import { AppError } from '../exceptions/AppError';

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details: unknown[];
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: PaginationMeta
): void {
  const responseBody: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (meta) {
    responseBody.meta = meta;
  }

  res.status(statusCode).json(responseBody);
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

export function sendError(res: Response, error: AppError): void {
  const responseBody: ErrorResponse = {
    success: false,
    error: {
      code: error.errorCode,
      message: error.message,
      details: error.details,
    },
  };

  res.status(error.statusCode).json(responseBody);
}
