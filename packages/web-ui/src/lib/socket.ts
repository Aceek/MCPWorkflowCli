/**
 * Socket.io Client Configuration
 *
 * Provides a singleton socket instance for real-time communication.
 * Discovers the WebSocket port dynamically from the database.
 */

import { io, Socket } from 'socket.io-client'

// Event types (must match server-side events.ts)
export const EVENTS = {
  WORKFLOW_CREATED: 'workflow:created',
  WORKFLOW_UPDATED: 'workflow:updated',
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  DECISION_CREATED: 'decision:created',
  ISSUE_CREATED: 'issue:created',
  MILESTONE_CREATED: 'milestone:created',
  STATS_UPDATED: 'stats:updated',
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]

let socket: Socket | null = null
let currentPort: number | null = null
let discoveryInterval: NodeJS.Timeout | null = null

const DISCOVERY_INTERVAL_MS = 5000 // Check for port changes every 5s

/**
 * Fetch the current WebSocket port from the API.
 */
async function discoverPort(): Promise<number | null> {
  try {
    const response = await fetch('/api/websocket-port')
    if (!response.ok) {
      return null
    }
    const data = await response.json()
    return data.port ?? null
  } catch {
    return null
  }
}

/**
 * Get or create the Socket.io client instance.
 * Connects to the dynamically discovered port.
 */
export async function getSocketAsync(): Promise<Socket | null> {
  const port = await discoverPort()

  if (!port) {
    console.warn('[WebSocket] No active server found')
    return null
  }

  // If port changed, reconnect
  if (socket && currentPort !== port) {
    console.log(
      `[WebSocket] Port changed from ${currentPort} to ${port}, reconnecting...`
    )
    socket.disconnect()
    socket = null
  }

  if (!socket) {
    currentPort = port
    const url = `http://localhost:${port}`

    socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      socket.on('connect', () => {
        console.log(`[WebSocket] Connected to port ${port}:`, socket?.id)
      })

      socket.on('disconnect', (reason) => {
        console.log('[WebSocket] Disconnected:', reason)
      })

      socket.on('connect_error', (error) => {
        console.error('[WebSocket] Connection error:', error.message)
      })
    }
  }

  return socket
}

/**
 * Get socket synchronously (may return null if not initialized).
 * Use getSocketAsync() for initial connection.
 */
export function getSocket(): Socket | null {
  return socket
}

/**
 * Start periodic port discovery.
 * Reconnects automatically if the server port changes.
 */
export function startPortDiscovery(): void {
  if (discoveryInterval) return

  discoveryInterval = setInterval(async () => {
    const newPort = await discoverPort()

    if (newPort && newPort !== currentPort && socket) {
      console.log(
        `[WebSocket] Server port changed to ${newPort}, reconnecting...`
      )
      socket.disconnect()
      socket = null
      const reconnectedSocket = await getSocketAsync()
      if (reconnectedSocket) {
        reconnectedSocket.connect()
      }
    }
  }, DISCOVERY_INTERVAL_MS)
}

/**
 * Stop port discovery.
 */
export function stopPortDiscovery(): void {
  if (discoveryInterval) {
    clearInterval(discoveryInterval)
    discoveryInterval = null
  }
}

/**
 * Disconnect and cleanup the socket.
 */
export function disconnectSocket(): void {
  stopPortDiscovery()
  if (socket) {
    socket.disconnect()
    socket = null
    currentPort = null
  }
}
