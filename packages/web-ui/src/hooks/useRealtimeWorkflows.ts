'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Workflow } from '@prisma/client'

type WorkflowWithCount = Workflow & {
  _count: {
    tasks: number
  }
}

interface Stats {
  total: number
  inProgress: number
  completed: number
  failed: number
}

interface WorkflowsData {
  workflows: WorkflowWithCount[]
  stats: Stats
  timestamp: string
}

interface UseRealtimeWorkflowsOptions {
  status?: string
  pollInterval?: number // in milliseconds
  enabled?: boolean
}

export function useRealtimeWorkflows(options: UseRealtimeWorkflowsOptions = {}) {
  const { status, pollInterval = 5000, enabled = true } = options

  const [data, setData] = useState<WorkflowsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchWorkflows = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (status && status !== 'all') {
        params.set('status', status)
      }

      const response = await fetch(`/api/workflows?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch workflows')
      }

      const newData = await response.json() as WorkflowsData
      setData(newData)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [status])

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchWorkflows()
    }
  }, [fetchWorkflows, enabled])

  // Polling
  useEffect(() => {
    if (!enabled || pollInterval <= 0) return

    const interval = setInterval(fetchWorkflows, pollInterval)
    return () => clearInterval(interval)
  }, [fetchWorkflows, pollInterval, enabled])

  const refresh = useCallback(() => {
    setIsLoading(true)
    fetchWorkflows()
  }, [fetchWorkflows])

  return {
    workflows: data?.workflows ?? [],
    stats: data?.stats ?? { total: 0, inProgress: 0, completed: 0, failed: 0 },
    isLoading,
    error,
    lastUpdate,
    refresh,
  }
}
