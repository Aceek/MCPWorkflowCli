'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWebSocket, EVENTS } from './useWebSocket'

interface Blocker {
  id: string
  type: string
  description: string
  resolution: string | null
  requiresHumanReview: boolean
  createdAt: Date | string
  task: {
    id: string
    name: string
    phaseId: string | null
  }
  workflow: {
    id: string
    name: string
    status: string
  }
}

interface BlockersResponse {
  blockers: Blocker[]
  count: number
  timestamp: string
}

interface UseBlockersOptions {
  enabled?: boolean
}

/**
 * Hook for fetching and monitoring blockers across all workflows.
 * Listens for real-time updates via WebSocket.
 */
export function useBlockers(options: UseBlockersOptions = {}) {
  const { enabled = true } = options

  const [blockers, setBlockers] = useState<Blocker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const { isConnected, on, off } = useWebSocket({ autoConnect: enabled })

  const fetchBlockers = useCallback(async () => {
    try {
      const response = await fetch('/api/blockers')
      if (!response.ok) {
        throw new Error('Failed to fetch blockers')
      }
      const data: BlockersResponse = await response.json()
      setBlockers(data.blockers)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchBlockers()
    }
  }, [fetchBlockers, enabled])

  // Listen for issue events to update blockers in real-time
  useEffect(() => {
    if (!isConnected) return

    const handleIssueCreated = () => {
      // Refetch to get updated blockers list
      fetchBlockers()
    }

    on(EVENTS.ISSUE_CREATED, handleIssueCreated)

    return () => {
      off(EVENTS.ISSUE_CREATED, handleIssueCreated)
    }
  }, [isConnected, on, off, fetchBlockers])

  return {
    blockers,
    isLoading,
    error,
    refresh: fetchBlockers,
    isConnected,
  }
}
