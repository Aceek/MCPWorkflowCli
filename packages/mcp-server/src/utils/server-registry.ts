/**
 * Server Registry
 *
 * Registers the WebSocket server port in SQLite for discovery by the Web UI.
 * Uses heartbeat to detect stale entries from crashed processes.
 */

import { prisma } from '../db.js'
import { createLogger } from './logger.js'

const logger = createLogger('server-registry')

const HEARTBEAT_INTERVAL_MS = 5000 // 5 seconds
const STALE_THRESHOLD_MS = 15000 // Consider stale if no heartbeat for 15s

let heartbeatInterval: NodeJS.Timeout | null = null

/**
 * Register the WebSocket server port in the database.
 * This allows the Web UI to discover which port to connect to.
 */
export async function registerServerPort(port: number): Promise<void> {
  const processId = process.pid

  await prisma.serverInfo.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      websocketPort: port,
      startedAt: new Date(),
      lastHeartbeat: new Date(),
      processId,
    },
    update: {
      websocketPort: port,
      startedAt: new Date(),
      lastHeartbeat: new Date(),
      processId,
    },
  })

  logger.info('Registered WebSocket port', { port, processId })

  // Start heartbeat
  startHeartbeat()
}

/**
 * Update the heartbeat timestamp periodically.
 * This allows clients to detect if the server is still alive.
 */
function startHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
  }

  heartbeatInterval = setInterval(async () => {
    try {
      await prisma.serverInfo.update({
        where: { id: 'singleton' },
        data: { lastHeartbeat: new Date() },
      })
    } catch (error) {
      logger.warn('Failed to update heartbeat', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }, HEARTBEAT_INTERVAL_MS)

  // Don't keep the process alive just for heartbeat
  heartbeatInterval.unref()
}

/**
 * Stop the heartbeat and unregister the server.
 * Called during graceful shutdown.
 */
export async function unregisterServer(): Promise<void> {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }

  try {
    await prisma.serverInfo.delete({
      where: { id: 'singleton' },
    })
    logger.info('Unregistered server')
  } catch (error) {
    logger.warn('Failed to unregister server', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * Get the current WebSocket port from the database.
 * Returns null if no server is registered or if the entry is stale.
 */
export async function getActiveServerPort(): Promise<number | null> {
  try {
    const info = await prisma.serverInfo.findUnique({
      where: { id: 'singleton' },
    })

    if (!info) {
      return null
    }

    // Check if the entry is stale
    const now = Date.now()
    const lastHeartbeat = info.lastHeartbeat.getTime()

    if (now - lastHeartbeat > STALE_THRESHOLD_MS) {
      logger.warn('Stale entry detected', { lastHeartbeat: info.lastHeartbeat })
      return null
    }

    return info.websocketPort
  } catch {
    return null
  }
}
