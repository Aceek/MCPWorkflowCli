/**
 * Logger Type Definitions
 *
 * Shared type definitions for the logging system.
 * Actual implementations are in:
 * - `packages/mcp-server/src/utils/logger.ts` (for MCP Server)
 * - `packages/web-ui/src/lib/logger.ts` (for Web UI)
 *
 * @packageDocumentation
 */

/**
 * Log levels in order of severity
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Structured log entry
 */
export interface LogEntry {
  timestamp: string
  level: LogLevel
  module: string
  message: string
  context?: Record<string, unknown>
}

/**
 * Logger interface
 */
export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, context?: Record<string, unknown>): void
}

/**
 * Logger configuration options
 */
export interface LoggerOptions {
  /**
   * Minimum log level to output
   * @default 'info'
   */
  minLevel?: LogLevel

  /**
   * Custom output function
   * @default Outputs to stderr (Node.js) or console (browser)
   */
  output?: (entry: LogEntry) => void
}
