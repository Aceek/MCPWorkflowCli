/**
 * WebSocket Port Discovery API
 *
 * Returns the current WebSocket server port from the database.
 * The MCP server registers its port on startup and updates a heartbeat.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api-websocket-port')

const STALE_THRESHOLD_MS = 15000 // Must match server-registry.ts

export async function GET() {
  try {
    const info = await prisma.serverInfo.findUnique({
      where: { id: 'singleton' },
    })

    if (!info) {
      return NextResponse.json(
        { error: 'No WebSocket server registered', port: null },
        { status: 404 }
      )
    }

    // Check if the entry is stale
    const now = Date.now()
    const lastHeartbeat = info.lastHeartbeat.getTime()

    if (now - lastHeartbeat > STALE_THRESHOLD_MS) {
      return NextResponse.json(
        {
          error: 'WebSocket server is stale',
          port: null,
          lastHeartbeat: info.lastHeartbeat,
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      port: info.websocketPort,
      startedAt: info.startedAt,
      lastHeartbeat: info.lastHeartbeat,
      processId: info.processId,
    })
  } catch (error) {
    logger.error('Failed to get WebSocket port', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Failed to query database', port: null },
      { status: 500 }
    )
  }
}
