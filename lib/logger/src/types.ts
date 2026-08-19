import type { LoggerOptions } from "pino";

export interface LogContext {
  /** ID de correlação para rastrear requests entre serviços */
  correlationId?: string;
  /** ID do usuário autenticado */
  userId?: string;
  /** ID da sessão */
  sessionId?: string;
  /** Rota/path da requisição */
  path?: string;
  /** Duração em ms de uma operação */
  durationMs?: number;
  /** Metadados extras livres */
  [key: string]: unknown;
}

export interface CreateLoggerOptions {
  /** Nome da aplicação consumidora (ex: 'web', 'api', 'admin') */
  appName: string;
  /** Ambiente de execução */
  environment?: string;
  /** Nível mínimo de log (sobrescreve LOG_LEVEL do env) */
  level?: string;
  /** Opções extras do pino para merge */
  pinoOptions?: LoggerOptions;
}

export const LEVEL_LABELS: Record<number, string> = {
  10: "trace",
  20: "debug",
  30: "info",
  40: "warn",
  50: "error",
  60: "fatal",
};
