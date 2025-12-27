/**
 * WebSocket Events Service
 *
 * Provides type-safe methods to emit real-time events to connected clients.
 */

import type {
  Workflow,
  Task,
  Decision,
  Issue,
  Milestone,
} from '@prisma/client'
import { getIO } from './server.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('websocket-events')

// ============================================
// Event Types
// ============================================

export interface WorkflowCreatedEvent {
  workflow: Workflow
}

export interface WorkflowUpdatedEvent {
  workflow: Workflow
}

export interface TaskCreatedEvent {
  task: Task
  workflowId: string
}

export interface TaskUpdatedEvent {
  task: Task
  workflowId: string
}

export interface DecisionCreatedEvent {
  decision: Decision
  taskId: string
  workflowId: string
}

export interface IssueCreatedEvent {
  issue: Issue
  taskId: string
  workflowId: string
}

export interface MilestoneCreatedEvent {
  milestone: Milestone
  taskId: string
  workflowId: string
}

// ============================================
// Event Names (constants for type safety)
// ============================================

export const EVENTS = {
  // Workflow events
  WORKFLOW_CREATED: 'workflow:created',
  WORKFLOW_UPDATED: 'workflow:updated',
  // Task events
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  // Decision events
  DECISION_CREATED: 'decision:created',
  // Issue events
  ISSUE_CREATED: 'issue:created',
  // Milestone events
  MILESTONE_CREATED: 'milestone:created',
  // Stats update (for dashboard)
  STATS_UPDATED: 'stats:updated',
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]

// ============================================
// Generic Emit Helper
// ============================================

interface EmitOptions {
  eventName: EventName
  payload: unknown
  workflowId?: string
  broadcastToAll?: boolean
  emitStats?: boolean
  logData?: Record<string, unknown>
}

/**
 * Generic helper to emit WebSocket events with consistent behavior.
 * Reduces repetition across emit functions.
 */
function emitEvent(options: EmitOptions): void {
  const io = getIO()
  if (!io) return

  const { eventName, payload, workflowId, broadcastToAll = false, emitStats = false, logData = {} } = options

  // Emit to all clients if requested (for list views)
  if (broadcastToAll) {
    io.emit(eventName, payload)
  }

  // Emit to workflow-specific room if workflowId provided (for detail views)
  if (workflowId) {
    io.to(`workflow:${workflowId}`).emit(eventName, payload)
  }

  // Emit stats update if requested (triggers dashboard refresh)
  if (emitStats) {
    io.emit(EVENTS.STATS_UPDATED, { timestamp: new Date().toISOString() })
  }

  logger.info(`Emitted ${eventName}`, { event: eventName, ...logData })
}

// ============================================
// Emit Functions
// ============================================

/**
 * Emit a workflow created event to all connected clients.
 */
export function emitWorkflowCreated(workflow: Workflow): void {
  emitEvent({
    eventName: EVENTS.WORKFLOW_CREATED,
    payload: { workflow } satisfies WorkflowCreatedEvent,
    broadcastToAll: true,
    emitStats: true,
    logData: { workflowId: workflow.id },
  })
}

/**
 * Emit a workflow updated event to all clients and workflow room.
 */
export function emitWorkflowUpdated(workflow: Workflow): void {
  emitEvent({
    eventName: EVENTS.WORKFLOW_UPDATED,
    payload: { workflow } satisfies WorkflowUpdatedEvent,
    workflowId: workflow.id,
    broadcastToAll: true,
    emitStats: true,
    logData: { workflowId: workflow.id },
  })
}

/**
 * Emit a task created event.
 */
export function emitTaskCreated(task: Task, workflowId: string): void {
  emitEvent({
    eventName: EVENTS.TASK_CREATED,
    payload: { task, workflowId } satisfies TaskCreatedEvent,
    workflowId,
    broadcastToAll: true,
    logData: { taskId: task.id, workflowId },
  })
}

/**
 * Emit a task updated event (e.g., task completed).
 */
export function emitTaskUpdated(task: Task, workflowId: string): void {
  emitEvent({
    eventName: EVENTS.TASK_UPDATED,
    payload: { task, workflowId } satisfies TaskUpdatedEvent,
    workflowId,
    broadcastToAll: true,
    logData: { taskId: task.id, workflowId },
  })
}

/**
 * Emit a decision created event.
 */
export function emitDecisionCreated(
  decision: Decision,
  taskId: string,
  workflowId: string
): void {
  emitEvent({
    eventName: EVENTS.DECISION_CREATED,
    payload: { decision, taskId, workflowId } satisfies DecisionCreatedEvent,
    workflowId,
    logData: { decisionId: decision.id, taskId, workflowId },
  })
}

/**
 * Emit an issue created event.
 */
export function emitIssueCreated(
  issue: Issue,
  taskId: string,
  workflowId: string
): void {
  emitEvent({
    eventName: EVENTS.ISSUE_CREATED,
    payload: { issue, taskId, workflowId } satisfies IssueCreatedEvent,
    workflowId,
    logData: { issueId: issue.id, taskId, workflowId },
  })
}

/**
 * Emit a milestone created event.
 */
export function emitMilestoneCreated(
  milestone: Milestone,
  taskId: string,
  workflowId: string
): void {
  emitEvent({
    eventName: EVENTS.MILESTONE_CREATED,
    payload: { milestone, taskId, workflowId } satisfies MilestoneCreatedEvent,
    workflowId,
    logData: { milestoneId: milestone.id, taskId, workflowId },
  })
}
