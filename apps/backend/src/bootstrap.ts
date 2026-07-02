import { LoggerService } from "@nestjs/common";
import { pino } from "pino";

/**
 * Creates a Pino logger
 *
 * @param destination - File descriptor to write to: 1 (stdout) or 2 (stderr)
 * @returns Configured pino logger instance
 */
export function createPinoLogger(destination: 1 | 2) {
  return pino({
    level: process.env.LOG_LEVEL || "info",
    transport: {
      target: "pino-pretty",
      options: {
        destination,
        colorize: true,
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  });
}

/**
 * Creates a NestJS-compatible logger service from a Pino logger
 *
 * @param pinoLogger - The pino logger instance
 * @returns NestJS LoggerService implementation
 */
export function createLoggerService(pinoLogger: any): LoggerService {
  return {
    log: (message: any, context?: string) => {
      pinoLogger.info({ context }, message);
    },
    error: (message: any, trace?: string, context?: string) => {
      pinoLogger.error({ context, trace }, message);
    },
    warn: (message: any, context?: string) => {
      pinoLogger.warn({ context }, message);
    },
    debug: (message: any, context?: string) => {
      pinoLogger.debug({ context }, message);
    },
    verbose: (message: any, context?: string) => {
      pinoLogger.trace({ context }, message);
    },
  };
}
