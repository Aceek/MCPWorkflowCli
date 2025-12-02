/**
 * Logger for Web UI
 *
 * Wraps the shared logger for client-side usage.
 * The shared logger uses console.error internally, which is correct for browser environments.
 */

import { createLogger as createSharedLogger } from '@mcp-tracker/shared'

/**
 * Create a logger instance for a specific module in the Web UI.
 *
 * @param module - Module name (e.g., 'socket', 'api')
 * @returns Logger instance
 *
 * @example
 * ```typescript
 * const logger = createLogger('socket')
 * logger.info('Connected to WebSocket', { port: 3002 })
 * ```
 */
export function createLogger(module: string) {
  // In browser environment, the shared logger's console.error output is appropriate
  // (there's no stdout/stderr distinction in browser console)
  return createSharedLogger(module)
}
