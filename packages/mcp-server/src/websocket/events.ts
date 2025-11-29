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
  WorkflowStatus,
  TaskStatus,
} from '@prisma/client'
import { getIO } from './server.js'

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
// Emit Functions
// ============================================

/**
 * Emit a workflow created event to all connected clients.
 */
export function emitWorkflowCreated(workflow: Workflow): void {
  const io = getIO()
  if (!io) return

  const event: WorkflowCreatedEvent = { workflow }
  io.emit(EVENTS.WORKFLOW_CREATED, event)
  io.emit(EVENTS.STATS_UPDATED, { timestamp: new Date().toISOString() })

  console.error(`[WebSocket] Emitted ${EVENTS.WORKFLOW_CREATED}: ${workflow.id}`)
}

/**
 * Emit a workflow updated event to all clients and workflow room.
 */
export function emitWorkflowUpdated(workflow: Workflow): void {
  const io = getIO()
  if (!io) return

  const event: WorkflowUpdatedEvent = { workflow }

  // Emit to all clients (for list view)
  io.emit(EVENTS.WORKFLOW_UPDATED, event)

  // Emit to workflow-specific room (for detail view)
  io.to(`workflow:${workflow.id}`).emit(EVENTS.WORKFLOW_UPDATED, event)

  io.emit(EVENTS.STATS_UPDATED, { timestamp: new Date().toISOString() })

  console.error(`[WebSocket] Emitted ${EVENTS.WORKFLOW_UPDATED}: ${workflow.id}`)
}

/**
 * Emit a task created event.
 */
export function emitTaskCreated(task: Task, workflowId: string): void {
  const io = getIO()
  if (!io) return

  const event: TaskCreatedEvent = { task, workflowId }

  // Emit to all clients
  io.emit(EVENTS.TASK_CREATED, event)

  // Emit to workflow-specific room
  io.to(`workflow:${workflowId}`).emit(EVENTS.TASK_CREATED, event)

  console.error(`[WebSocket] Emitted ${EVENTS.TASK_CREATED}: ${task.id}`)
}

/**
 * Emit a task updated event (e.g., task completed).
 */
export function emitTaskUpdated(task: Task, workflowId: string): void {
  const io = getIO()
  if (!io) return

  const event: TaskUpdatedEvent = { task, workflowId }

  // Emit to all clients
  io.emit(EVENTS.TASK_UPDATED, event)

  // Emit to workflow-specific room
  io.to(`workflow:${workflowId}`).emit(EVENTS.TASK_UPDATED, event)

  console.error(`[WebSocket] Emitted ${EVENTS.TASK_UPDATED}: ${task.id}`)
}

/**
 * Emit a decision created event.
 */
export function emitDecisionCreated(
  decision: Decision,
  taskId: string,
  workflowId: string
): void {
  const io = getIO()
  if (!io) return

  const event: DecisionCreatedEvent = { decision, taskId, workflowId }

  // Only emit to workflow-specific room (detail view)
  io.to(`workflow:${workflowId}`).emit(EVENTS.DECISION_CREATED, event)

  console.error(`[WebSocket] Emitted ${EVENTS.DECISION_CREATED}: ${decision.id}`)
}

/**
 * Emit an issue created event.
 */
export function emitIssueCreated(
  issue: Issue,
  taskId: string,
  workflowId: string
): void {
  const io = getIO()
  if (!io) return

  const event: IssueCreatedEvent = { issue, taskId, workflowId }

  // Only emit to workflow-specific room (detail view)
  io.to(`workflow:${workflowId}`).emit(EVENTS.ISSUE_CREATED, event)

  console.error(`[WebSocket] Emitted ${EVENTS.ISSUE_CREATED}: ${issue.id}`)
}

/**
 * Emit a milestone created event.
 */
export function emitMilestoneCreated(
  milestone: Milestone,
  taskId: string,
  workflowId: string
): void {
  const io = getIO()
  if (!io) return

  const event: MilestoneCreatedEvent = { milestone, taskId, workflowId }

  // Only emit to workflow-specific room (detail view)
  io.to(`workflow:${workflowId}`).emit(EVENTS.MILESTONE_CREATED, event)

  console.error(`[WebSocket] Emitted ${EVENTS.MILESTONE_CREATED}: ${milestone.id}`)
}
