import pino, { type Logger } from 'pino';
import { type CreateLoggerOptions, LEVEL_LABELS } from './types';

export function createLogger(options: CreateLoggerOptions): Logger {
  const {
    appName,
    environment = process.env.NODE_ENV ?? 'development',
    level = process.env.LOG_LEVEL ?? 'info',
    pinoOptions = {},
  } = options;

  const baseFields = {
    app: appName,
    environment,
    hostname: process.env.HOSTNAME ?? 'unknown',
    namespace: process.env.K8S_NAMESPACE ?? undefined,
    podName: process.env.K8S_POD_NAME ?? undefined,
    nodeName: process.env.K8S_NODE_NAME ?? undefined,
  };

  const isEdge = typeof process?.versions?.node === 'undefined';

  return pino({
    // No Edge: não loga nada (sem quebrar API do pino)
    level: isEdge ? 'silent' : level,

    mixin(_context, levelNum) {
      return {
        logId: crypto.randomUUID(),
        level: LEVEL_LABELS[levelNum] ?? levelNum,
        levelValue: levelNum,
        ...baseFields,
      };
    },

    formatters: {
      level: (label) => ({ level: label }),
      bindings: () => ({}),
    },

    timestamp: pino.stdTimeFunctions.isoTime,

    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },

    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'body.password',
        'body.token',
        'body.secret',
        '*.password',
        '*.token',
        '*.secret',
        '*.creditCard',
        '*.cpf',
        '*.ssn',
      ],
      censor: '[REDACTED]',
    },

    ...pinoOptions,
  });
}

const logger = createLogger({
  appName: process.env.APP_URL || '',
  environment: process.env.NODE_ENV,
});

export default logger;
