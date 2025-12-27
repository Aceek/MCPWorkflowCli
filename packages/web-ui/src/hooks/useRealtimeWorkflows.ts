'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Workflow } from '@prisma/client'
import { useWebSocket, EVENTS } from './useWebSocket'
import { fetchWorkflows, type WorkflowsResponse, type WorkflowWithCount } from '@/lib/api'

interface Stats {
  total: number
  pending: number
  inProgress: number
  completed: number
  failed: number
  blocked: number
}

interface WorkflowCreatedEvent {
  workflow: Workflow
}

interface WorkflowUpdatedEvent {
  workflow: Workflow
}

interface TaskCreatedEvent {
  task: { id: string }
  workflowId: string
}

interface UseRealtimeWorkflowsOptions {
  status?: string
  enabled?: boolean
}

/**
 * Hook for real-time workflow list updates via WebSocket.
 *
 * Fetches initial data via REST API, then listens for WebSocket events
 * to update the data in real-time without polling.
 */
export function useRealtimeWorkflows(options: UseRealtimeWorkflowsOptions = {}) {
  const { status, enabled = true } = options

  const [workflows, setWorkflows] = useState<WorkflowWithCount[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    failed: 0,
    blocked: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Track current filter to avoid stale closures
  const statusRef = useRef(status)
  statusRef.current = status

  // WebSocket connection
  const { isConnected, on, off } = useWebSocket({ autoConnect: enabled })

  // Fetch workflows from API
  const fetchWorkflowsData = useCallback(async () => {
    try {
      const data: WorkflowsResponse = await fetchWorkflows(statusRef.current)
      setWorkflows(data.workflows)
      setStats(data.stats)
      setLastUpdate(new Date())
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
      fetchWorkflowsData()
    }
  }, [fetchWorkflowsData, enabled, status]) // Re-fetch when status filter changes

  // Handle WebSocket events
  useEffect(() => {
    if (!isConnected) return

    // Workflow created - add to list
    const handleWorkflowCreated = (event: WorkflowCreatedEvent) => {
      const currentStatus = statusRef.current

      // Only add if matches current filter
      if (
        !currentStatus ||
        currentStatus === 'all' ||
        event.workflow.status === currentStatus
      ) {
        setWorkflows((prev) => {
          // Check if already exists (avoid duplicates)
          if (prev.some((w) => w.id === event.workflow.id)) {
            return prev
          }
          // Add to beginning of list with task count
          return [
            { ...event.workflow, _count: { tasks: 0 } },
            ...prev,
          ]
        })
      }

      // Update stats
      setStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        inProgress: prev.inProgress + 1,
      }))

      setLastUpdate(new Date())
    }

    // Workflow updated - update in list
    const handleWorkflowUpdated = (event: WorkflowUpdatedEvent) => {
      const currentStatus = statusRef.current

      setWorkflows((prev) => {
        // Find and update the workflow
        const index = prev.findIndex((w) => w.id === event.workflow.id)

        if (index === -1) {
          // Not in list - might need to add if matches filter
          if (
            !currentStatus ||
            currentStatus === 'all' ||
            event.workflow.status === currentStatus
          ) {
            return [{ ...event.workflow, _count: { tasks: 0 } }, ...prev]
          }
          return prev
        }

        // Check if should remain in list based on filter
        if (
          currentStatus &&
          currentStatus !== 'all' &&
          event.workflow.status !== currentStatus
        ) {
          // Remove from list (status no longer matches filter)
          return prev.filter((w) => w.id !== event.workflow.id)
        }

        // Update in place
        const updated = [...prev]
        updated[index] = { ...updated[index]!, ...event.workflow }
        return updated
      })

      // Refetch stats to get accurate counts
      fetchWorkflowsData()

      setLastUpdate(new Date())
    }

    // Task created - increment task count for workflow
    const handleTaskCreated = (event: TaskCreatedEvent) => {
      setWorkflows((prev) => {
        const index = prev.findIndex((w) => w.id === event.workflowId)
        if (index === -1) return prev

        const updated = [...prev]
        const workflow = updated[index]!
        updated[index] = {
          ...workflow,
          _count: { tasks: workflow._count.tasks + 1 },
        }
        return updated
      })

      setLastUpdate(new Date())
    }

    // Subscribe to events
    on(EVENTS.WORKFLOW_CREATED, handleWorkflowCreated)
    on(EVENTS.WORKFLOW_UPDATED, handleWorkflowUpdated)
    on(EVENTS.TASK_CREATED, handleTaskCreated)

    return () => {
      off(EVENTS.WORKFLOW_CREATED, handleWorkflowCreated)
      off(EVENTS.WORKFLOW_UPDATED, handleWorkflowUpdated)
      off(EVENTS.TASK_CREATED, handleTaskCreated)
    }
  }, [isConnected, on, off, fetchWorkflowsData])

  const refresh = useCallback(() => {
    setIsLoading(true)
    fetchWorkflowsData()
  }, [fetchWorkflowsData])

  return {
    workflows,
    stats,
    isLoading,
    error,
    lastUpdate,
    refresh,
    isConnected,
  }
}
