import pino from 'pino';
import { env } from './env';

const isLocalDev =
  env.NODE_ENV === 'development' &&
  !process.env.RENDER &&
  !process.env.RAILWAY_ENVIRONMENT;

export const logger = pino({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: isLocalDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export default logger;
