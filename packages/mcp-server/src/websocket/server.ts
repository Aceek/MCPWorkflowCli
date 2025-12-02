/**
 * WebSocket Server
 *
 * Provides real-time communication for the Web UI.
 * Runs alongside the MCP stdio server on a separate HTTP port.
 */

import { Server as HttpServer, createServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('websocket-server')

const DEFAULT_WEBSOCKET_PORT = parseInt(process.env.WEBSOCKET_PORT ?? '3002', 10)
const MAX_PORT_ATTEMPTS = 10

export interface WebSocketServer {
  io: SocketIOServer
  httpServer: HttpServer
  port: number | null
  start: () => Promise<number | null>
  stop: () => Promise<void>
}

let instance: WebSocketServer | null = null

/**
 * Create Socket.IO server attached to an HTTP server
 */
function createSocketIOServer(httpServer: HttpServer): SocketIOServer {
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
    logger.info('Client connected', { socketId: socket.id })

    // Handle client subscribing to specific workflow
    socket.on('subscribe:workflow', (workflowId: string) => {
      socket.join(`workflow:${workflowId}`)
      logger.info('Client subscribed to workflow', { socketId: socket.id, workflowId })
    })

    // Handle client unsubscribing from workflow
    socket.on('unsubscribe:workflow', (workflowId: string) => {
      socket.leave(`workflow:${workflowId}`)
      logger.info('Client unsubscribed from workflow', { socketId: socket.id, workflowId })
    })

    socket.on('disconnect', (reason) => {
      logger.info('Client disconnected', { socketId: socket.id, reason })
    })

    socket.on('error', (error) => {
      logger.error('Socket error', { message: error.message })
    })
  })

  return io
}

/**
 * Try to listen on a port, returns true if successful
 */
function tryListen(httpServer: HttpServer, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const onError = (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        logger.warn('Port in use, trying next', { port })
      }
      httpServer.removeListener('listening', onListening)
      resolve(false)
    }

    const onListening = () => {
      httpServer.removeListener('error', onError)
      logger.info('Server listening', { port })
      resolve(true)
    }

    httpServer.once('error', onError)
    httpServer.once('listening', onListening)
    httpServer.listen(port)
  })
}

/**
 * Initialize and return the WebSocket server singleton.
 */
export function getWebSocketServer(): WebSocketServer {
  if (instance) {
    return instance
  }

  // These will be set when start() succeeds
  let currentHttpServer: HttpServer | null = null
  let currentIO: SocketIOServer | null = null

  /**
   * Try to start the server on available port.
   * Returns the port number if successful, null if all ports are busy.
   */
  const start = async (): Promise<number | null> => {
    for (let attempt = 0; attempt < MAX_PORT_ATTEMPTS; attempt++) {
      const port = DEFAULT_WEBSOCKET_PORT + attempt

      // Create fresh server for each attempt
      const httpServer = createServer()
      const success = await tryListen(httpServer, port)

      if (success) {
        // Attach Socket.IO to the working server
        currentHttpServer = httpServer
        currentIO = createSocketIOServer(httpServer)

        if (instance) {
          instance.port = port
          instance.httpServer = httpServer
          instance.io = currentIO
        }
        return port
      }

      // Failed - close and try next port
      httpServer.close()
    }

    logger.warn('Could not find available port', { attempts: MAX_PORT_ATTEMPTS })
    return null
  }

  const stop = (): Promise<void> => {
    return new Promise((resolve) => {
      if (currentIO && currentHttpServer) {
        currentIO.close(() => {
          currentHttpServer?.close(() => {
            logger.info('Server stopped')
            resolve()
          })
        })
      } else {
        resolve()
      }
    })
  }

  // Create placeholder - will be properly initialized on start()
  const placeholderHttpServer = createServer()
  const placeholderIO = new SocketIOServer()

  instance = {
    io: placeholderIO,
    httpServer: placeholderHttpServer,
    port: null,
    start,
    stop,
  }
  return instance
}

/**
 * Get the Socket.IO instance for emitting events.
 * Returns null if server not initialized.
 */
export function getIO(): SocketIOServer | null {
  return instance?.io ?? null
}
