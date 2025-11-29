/**
 * Socket.io Client Configuration
 *
 * Provides a singleton socket instance for real-time communication.
 */

import { io, Socket } from 'socket.io-client'

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL ?? 'http://localhost:3002'

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

/**
 * Get or create the Socket.io client instance.
 * This is a singleton - only one connection per client.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(WEBSOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false, // We'll connect manually
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      socket.on('connect', () => {
        console.log('[WebSocket] Connected:', socket?.id)
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
 * Disconnect and cleanup the socket.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
