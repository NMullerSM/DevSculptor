import pinoHttp from 'pino-http';
import { Request, Response } from 'express';
import { logger } from '../config/logger';

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req: Request) => req.requestId || (req.headers['x-request-id'] as string),
  customLogLevel: (_req: Request, res: Response, err?: Error) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      remoteAddress: req.remoteAddress,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
  autoLogging: {
    ignore: (req) => req.url === '/api/v1/health',
  },
});
