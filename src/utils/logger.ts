import winston from 'winston';
import { config } from '../config';

const prettyFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({
    level, message, timestamp, stack, ...meta
  }) => {
    const metaKeys = Object.keys(meta).filter((k) => k !== 'service');
    const metaString = metaKeys.length > 0
      ? ` ${JSON.stringify(Object.fromEntries(metaKeys.map((k) => [k, meta[k]])))}`
      : '';
    const stackString = typeof stack === 'string' ? `\n${stack}` : '';
    return `${timestamp} ${level} ${message}${metaString}${stackString}`;
  }),
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

export const createLogger = (overrides: Partial<typeof config.logging> = {}): winston.Logger => {
  const { level, format, silent } = { ...config.logging, ...overrides };

  return winston.createLogger({
    level,
    silent,
    levels: winston.config.npm.levels,
    format: format === 'json' ? jsonFormat : prettyFormat,
    transports: [new winston.transports.Console()],
  });
};

export const logger = createLogger();
