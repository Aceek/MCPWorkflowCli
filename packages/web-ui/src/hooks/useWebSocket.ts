'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { getSocket, EVENTS, type EventName } from '@/lib/socket'
import type { Socket } from 'socket.io-client'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface UseWebSocketOptions {
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean
  /** Workflow ID to subscribe to for detailed updates */
  workflowId?: string
}

interface UseWebSocketReturn {
  /** Current connection status */
  status: ConnectionStatus
  /** Whether the socket is connected */
  isConnected: boolean
  /** Manually connect to the WebSocket server */
  connect: () => void
  /** Manually disconnect from the WebSocket server */
  disconnect: () => void
  /** Subscribe to a specific event */
  on: <T>(event: EventName, callback: (data: T) => void) => void
  /** Unsubscribe from a specific event */
  off: <T>(event: EventName, callback: (data: T) => void) => void
}

/**
 * Hook to manage WebSocket connection and event subscriptions.
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { autoConnect = true, workflowId } = options
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const socketRef = useRef<Socket | null>(null)

  // Initialize socket connection
  useEffect(() => {
    const socket = getSocket()
    socketRef.current = socket

    // Connection event handlers
    const handleConnect = () => {
      setStatus('connected')
    }

    const handleDisconnect = () => {
      setStatus('disconnected')
    }

    const handleConnectError = () => {
      setStatus('error')
    }

    const handleConnecting = () => {
      setStatus('connecting')
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)
    socket.io.on('reconnect_attempt', handleConnecting)

    // Set initial status
    if (socket.connected) {
      setStatus('connected')
    } else if (autoConnect) {
      setStatus('connecting')
      socket.connect()
    }

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.io.off('reconnect_attempt', handleConnecting)
    }
  }, [autoConnect])

  // Subscribe to workflow-specific room if workflowId provided
  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !workflowId || status !== 'connected') return

    socket.emit('subscribe:workflow', workflowId)

    return () => {
      socket.emit('unsubscribe:workflow', workflowId)
    }
  }, [workflowId, status])

  const connect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      setStatus('connecting')
      socketRef.current.connect()
    }
  }, [])

  const disconnect = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.disconnect()
    }
  }, [])

  const on = useCallback(<T,>(event: EventName, callback: (data: T) => void) => {
    socketRef.current?.on(event, callback as (...args: unknown[]) => void)
  }, [])

  const off = useCallback(<T,>(event: EventName, callback: (data: T) => void) => {
    socketRef.current?.off(event, callback as (...args: unknown[]) => void)
  }, [])

  return {
    status,
    isConnected: status === 'connected',
    connect,
    disconnect,
    on,
    off,
  }
}

// Re-export EVENTS for convenience
export { EVENTS }
