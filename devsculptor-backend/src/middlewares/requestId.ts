import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['x-request-id'];
  const isValid = typeof incoming === 'string' && /^[\w-]{8,64}$/.test(incoming);
  const reqId = isValid ? incoming : uuidv4();

  req.requestId = reqId;
  res.setHeader('X-Request-Id', reqId);
  next();
}
