/**
 * Custom Logger System for MCP Workflow Tracker
 *
 * Lightweight, structured logging system compatible with MCP protocol.
 * Uses stderr for logs (stdout is reserved for MCP JSON-RPC protocol).
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
   * @default Outputs to stderr
   */
  output?: (entry: LogEntry) => void
}

/**
 * Log level priority for filtering
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/**
 * Format a log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  const level = entry.level.toUpperCase()
  const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
  return `[${entry.timestamp}] [${level}] [${entry.module}] ${entry.message}${contextStr}`
}

/**
 * Default output function (stderr)
 */
function defaultOutput(entry: LogEntry): void {
  // Use console.error for stderr output (stdout is reserved for MCP protocol)
  console.error(formatLogEntry(entry))
}

/**
 * Create a logger instance for a specific module
 *
 * @param module - Module name (e.g., 'git-snapshot', 'json-fields')
 * @param options - Logger configuration options
 * @returns Logger instance
 *
 * @example
 * ```typescript
 * const logger = createLogger('git-snapshot')
 * logger.warn('Failed to create Git snapshot', { error: 'Not a git repo' })
 * // Output: [2025-12-02T10:30:45.123Z] [WARN] [git-snapshot] Failed to create Git snapshot {"error":"Not a git repo"}
 * ```
 */
export function createLogger(module: string, options?: LoggerOptions): Logger {
  const minLevel = options?.minLevel ?? 'info'
  const output = options?.output ?? defaultOutput
  const minLevelPriority = LOG_LEVEL_PRIORITY[minLevel]

  /**
   * Internal log function
   */
  function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    // Filter by minimum level
    if (LOG_LEVEL_PRIORITY[level] < minLevelPriority) {
      return
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      context,
    }

    output(entry)
  }

  return {
    debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
    info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
    warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
    error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
  }
}
