/**
 * WebSocket Server
 *
 * Provides real-time communication for the Web UI.
 * Runs alongside the MCP stdio server on a separate HTTP port.
 */

import { Server as HttpServer, createServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'

const WEBSOCKET_PORT = parseInt(process.env.WEBSOCKET_PORT ?? '3002', 10)

export interface WebSocketServer {
  io: SocketIOServer
  httpServer: HttpServer
  start: () => void
  stop: () => Promise<void>
}

let instance: WebSocketServer | null = null

/**
 * Initialize and return the WebSocket server singleton.
 */
export function getWebSocketServer(): WebSocketServer {
  if (instance) {
    return instance
  }

  const httpServer = createServer()

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.WEB_UI_URL ?? 'http://localhost:3001',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Performance optimizations
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  })

  // Connection handling
  io.on('connection', (socket: Socket) => {
    // Log to stderr (stdout reserved for MCP protocol)
    console.error(`[WebSocket] Client connected: ${socket.id}`)

    // Handle client subscribing to specific workflow
    socket.on('subscribe:workflow', (workflowId: string) => {
      socket.join(`workflow:${workflowId}`)
      console.error(`[WebSocket] Client ${socket.id} subscribed to workflow:${workflowId}`)
    })

    // Handle client unsubscribing from workflow
    socket.on('unsubscribe:workflow', (workflowId: string) => {
      socket.leave(`workflow:${workflowId}`)
      console.error(`[WebSocket] Client ${socket.id} unsubscribed from workflow:${workflowId}`)
    })

    socket.on('disconnect', (reason) => {
      console.error(`[WebSocket] Client disconnected: ${socket.id} (${reason})`)
    })

    socket.on('error', (error) => {
      console.error(`[WebSocket] Socket error: ${error.message}`)
    })
  })

  const start = () => {
    httpServer.listen(WEBSOCKET_PORT, () => {
      console.error(`[WebSocket] Server listening on port ${WEBSOCKET_PORT}`)
    })
  }

  const stop = (): Promise<void> => {
    return new Promise((resolve) => {
      io.close(() => {
        httpServer.close(() => {
          console.error('[WebSocket] Server stopped')
          resolve()
        })
      })
    })
  }

  instance = { io, httpServer, start, stop }
  return instance
}

/**
 * Get the Socket.IO instance for emitting events.
 * Returns null if server not initialized.
 */
export function getIO(): SocketIOServer | null {
  return instance?.io ?? null
}
