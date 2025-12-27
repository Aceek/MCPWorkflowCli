/**
 * Centralized API client for Web UI
 *
 * All fetch() calls should go through this module for consistency,
 * error handling, and logging.
 */

import type { Workflow, Phase, Task, Issue } from '@prisma/client'
import { createLogger } from './logger'

const logger = createLogger('api')

/**
 * Phase with task count
 */
export type PhaseWithCount = Phase & {
  _count: {
    tasks: number
  }
}

/**
 * Workflow with phases and task count
 */
export type WorkflowWithCount = Workflow & {
  phases?: PhaseWithCount[]
  _count: {
    tasks: number
    phases?: number
  }
}

/**
 * Workflows response structure
 */
export interface WorkflowsResponse {
  workflows: WorkflowWithCount[]
  stats: {
    total: number
    pending: number
    inProgress: number
    completed: number
    failed: number
    blocked: number
  }
  timestamp: string
}

/**
 * Fetch workflows from API with optional status filter
 *
 * @param status - Filter by workflow status ('all', 'IN_PROGRESS', 'SUCCESS', 'FAILED')
 * @returns Workflows data with stats
 * @throws Error if fetch fails
 */
export async function fetchWorkflows(status?: string): Promise<WorkflowsResponse> {
  const params = new URLSearchParams()
  if (status && status !== 'all') {
    params.set('status', status)
  }

  const url = `/api/workflows${params.toString() ? `?${params.toString()}` : ''}`
  logger.debug('Fetching workflows', { url, status })

  const response = await fetch(url)
  if (!response.ok) {
    const error = `Failed to fetch workflows: ${response.status}`
    logger.error(error, { status: response.status, statusText: response.statusText })
    throw new Error(error)
  }

  const data = (await response.json()) as WorkflowsResponse
  logger.debug('Workflows fetched successfully', { count: data.workflows.length })

  return data
}

/**
 * Fetch the WebSocket port from the database
 *
 * The WebSocket server writes its port to the database for dynamic discovery.
 * This function retrieves that port so the client can connect.
 *
 * @returns WebSocket port number, or null if no server is running
 */
export async function fetchWebSocketPort(): Promise<number | null> {
  try {
    logger.debug('Fetching WebSocket port')

    const response = await fetch('/api/websocket-port')
    if (!response.ok) {
      logger.warn('WebSocket port not available', { status: response.status })
      return null
    }

    const data = await response.json()
    const port = data.port ?? null

    if (port) {
      logger.info('WebSocket port discovered', { port })
    } else {
      logger.warn('No active WebSocket server found')
    }

    return port
  } catch (error) {
    logger.warn('Failed to fetch WebSocket port', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return null
  }
}

// ============================================
// Phase and Task Types (for Workflow detail)
// ============================================

/**
 * Phase with task count and duration
 */
export type PhaseWithStats = Phase & {
  _count: {
    tasks: number
  }
  totalDurationMs?: number
  tasksCount?: number
  completedTasksCount?: number
  tasks?: TaskWithCounts[]
}

/**
 * Task with counts for related entities
 */
export type TaskWithCounts = Task & {
  _count: {
    decisions: number
    issues: number
    milestones: number
  }
}

/**
 * Workflow with phases and full details
 */
export type WorkflowWithPhases = Workflow & {
  phases: PhaseWithStats[]
  _count: {
    tasks: number
    phases: number
  }
}

/**
 * Workflow detail response structure
 */
export interface WorkflowDetailResponse {
  workflow: WorkflowWithPhases
  blockers: (Issue & {
    task: {
      id: string
      name: string
      phaseId: string | null
    }
  })[]
  timestamp: string
}

/**
 * Fetch a single workflow with phases and blockers
 */
export async function fetchWorkflow(id: string): Promise<WorkflowDetailResponse> {
  const url = `/api/workflows/${id}`
  logger.debug('Fetching workflow', { url, id })

  const response = await fetch(url)
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Workflow not found')
    }
    const error = `Failed to fetch workflow: ${response.status}`
    logger.error(error, { status: response.status, statusText: response.statusText })
    throw new Error(error)
  }

  const data = (await response.json()) as WorkflowDetailResponse
  logger.debug('Workflow fetched successfully', { id: data.workflow.id })

  return data
}
