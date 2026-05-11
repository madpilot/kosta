import winston from 'winston';
import { RUNTIME_CONFIG_DEFAULTS, type RuntimeConfig } from '../runtime-config';

type LoggingConfig = RuntimeConfig['logging'];

const prettyFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaKeys = Object.keys(meta).filter((k) => k !== 'service');
    const metaString =
      metaKeys.length > 0
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

export const createLogger = (overrides: Partial<LoggingConfig> = {}): winston.Logger => {
  const { level, format, silent } = { ...RUNTIME_CONFIG_DEFAULTS.logging, ...overrides };

  return winston.createLogger({
    level,
    silent,
    levels: winston.config.npm.levels,
    format: format === 'json' ? jsonFormat : prettyFormat,
    transports: [new winston.transports.Console()],
  });
};

export const logger = createLogger();

// Reconfigure the shared logger from the resolved runtime config (read from
// the DB at boot). Tests construct their own logger via createLogger and so
// don't need to call this.
export const configureLogger = (logging: LoggingConfig): void => {
  logger.level = logging.level;
  logger.silent = logging.silent;
  logger.format = logging.format === 'json' ? jsonFormat : prettyFormat;
};
