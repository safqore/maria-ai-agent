/**
 * Logger Utility
 *
 * A centralized logging system for the frontend application that:
 * - Provides consistent logging across the application
 * - Respects environment configuration for verbose logging
 * - Adds context to log messages
 * - Formats log output for readability
 */

import { VERBOSE_LOGGING } from './config';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Log data object interface
 */
export interface LogData {
  [key: string]: any;
}

/**
 * Configuration for the logger
 */
interface LoggerConfig {
  /** Whether to enable debug logs even in production */
  debugInProduction: boolean;
}

/**
 * Default configuration
 */
const defaultConfig: LoggerConfig = {
  debugInProduction: false,
};

/**
 * Logger class that handles all logging operations
 */
class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      ...defaultConfig,
      ...config,
    };
  }

  /**
   * Log a debug message (only in development or when verbose logging is enabled)
   *
   * @param message - The message to log
   * @param data - Additional contextual data
   */
  debug(message: string, data?: LogData): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(`[DEBUG] ${message}`, data ?? '');
    }
  }

  /**
   * Log an info message
   *
   * @param message - The message to log
   * @param data - Additional contextual data
   */
  info(message: string, data?: LogData): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(`[INFO] ${message}`, data ?? '');
    }
  }

  /**
   * Log a warning message
   *
   * @param message - The message to log
   * @param data - Additional contextual data
   */
  warn(message: string, data?: LogData): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARNING] ${message}`, data ?? '');
    }
  }

  /**
   * Log an error message
   *
   * @param error - The error to log
   * @param context - Additional context for the error
   */
  error(error: Error | string, context?: LogData): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorMessage = error instanceof Error ? error.message : error;
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error(`[ERROR] ${errorMessage}`, {
        stack: errorStack,
        ...context,
      });
    }
  }

  /**
   * Group related log messages together
   *
   * @param groupName - Name for the log group
   * @param logFunc - Function that contains the logs to group
   */
  group(groupName: string, logFunc: () => void): void {
    if (console.group) {
      console.group(groupName);
      logFunc();
      console.groupEnd();
    } else {
      // Fallback for environments without console.group
      console.log(`[GROUP START] ${groupName}`);
      logFunc();
      console.log(`[GROUP END] ${groupName}`);
    }
  }

  /**
   * Log performance measurement
   *
   * @param label - Label for the performance measurement
   * @param startTime - Start time from performance.now()
   */
  logPerformance(label: string, startTime: number): void {
    const duration = Math.round(performance.now() - startTime);
    this.info(`Performance: ${label}`, { duration: `${duration}ms` });
  }

  /**
   * Determine if a message at the given level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    // Always log errors and warnings
    if (level === LogLevel.ERROR || level === LogLevel.WARN) {
      return true;
    }

    // Log info messages in production
    if (level === LogLevel.INFO) {
      return true;
    }

    // Log debug messages only in development or when verbose logging is enabled
    if (level === LogLevel.DEBUG) {
      return (
        process.env.NODE_ENV !== 'production' || VERBOSE_LOGGING || this.config.debugInProduction
      );
    }

    return false;
  }
}

/**
 * Export a singleton instance of the logger
 */
export const logger = new Logger();

/**
 * Performance measurement utility
 */
export const measurePerformance = (label: string, func: () => any): any => {
  const start = performance.now();
  try {
    return func();
  } finally {
    logger.logPerformance(label, start);
  }
};
