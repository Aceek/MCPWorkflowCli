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
  Mission,
  Phase,
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

// Mission System Events
export interface MissionCreatedEvent {
  mission: Mission
}

export interface MissionUpdatedEvent {
  mission: Mission
}

export interface PhaseCreatedEvent {
  phase: Phase
  missionId: string
}

export interface PhaseUpdatedEvent {
  phase: Phase
  missionId: string
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
  // Mission system events
  MISSION_CREATED: 'mission:created',
  MISSION_UPDATED: 'mission:updated',
  PHASE_CREATED: 'phase:created',
  PHASE_UPDATED: 'phase:updated',
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

  logger.info('Emitted workflow created', { event: EVENTS.WORKFLOW_CREATED, workflowId: workflow.id })
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

  logger.info('Emitted workflow updated', { event: EVENTS.WORKFLOW_UPDATED, workflowId: workflow.id })
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

  logger.info('Emitted task created', { event: EVENTS.TASK_CREATED, taskId: task.id, workflowId })
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

  logger.info('Emitted task updated', { event: EVENTS.TASK_UPDATED, taskId: task.id, workflowId })
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

  logger.info('Emitted decision created', { event: EVENTS.DECISION_CREATED, decisionId: decision.id, taskId, workflowId })
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

  logger.info('Emitted issue created', { event: EVENTS.ISSUE_CREATED, issueId: issue.id, taskId, workflowId })
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

  logger.info('Emitted milestone created', { event: EVENTS.MILESTONE_CREATED, milestoneId: milestone.id, taskId, workflowId })
}

// ============================================
// Mission System Emit Functions
// ============================================

/**
 * Emit a mission created event to all connected clients.
 */
export function emitMissionCreated(mission: Mission): void {
  const io = getIO()
  if (!io) return

  const event: MissionCreatedEvent = { mission }
  io.emit(EVENTS.MISSION_CREATED, event)
  io.emit(EVENTS.STATS_UPDATED, { timestamp: new Date().toISOString() })

  logger.info('Emitted mission created', { event: EVENTS.MISSION_CREATED, missionId: mission.id })
}

/**
 * Emit a mission updated event to all clients and mission room.
 */
export function emitMissionUpdated(mission: Mission): void {
  const io = getIO()
  if (!io) return

  const event: MissionUpdatedEvent = { mission }

  // Emit to all clients (for list view)
  io.emit(EVENTS.MISSION_UPDATED, event)

  // Emit to mission-specific room (for detail view)
  io.to(`mission:${mission.id}`).emit(EVENTS.MISSION_UPDATED, event)

  io.emit(EVENTS.STATS_UPDATED, { timestamp: new Date().toISOString() })

  logger.info('Emitted mission updated', { event: EVENTS.MISSION_UPDATED, missionId: mission.id })
}

/**
 * Emit a phase created event.
 */
export function emitPhaseCreated(phase: Phase, missionId: string): void {
  const io = getIO()
  if (!io) return

  const event: PhaseCreatedEvent = { phase, missionId }

  // Emit to all clients
  io.emit(EVENTS.PHASE_CREATED, event)

  // Emit to mission-specific room
  io.to(`mission:${missionId}`).emit(EVENTS.PHASE_CREATED, event)

  logger.info('Emitted phase created', { event: EVENTS.PHASE_CREATED, phaseId: phase.id, missionId })
}

/**
 * Emit a phase updated event (e.g., phase completed).
 */
export function emitPhaseUpdated(phase: Phase, missionId: string): void {
  const io = getIO()
  if (!io) return

  const event: PhaseUpdatedEvent = { phase, missionId }

  // Emit to all clients
  io.emit(EVENTS.PHASE_UPDATED, event)

  // Emit to mission-specific room
  io.to(`mission:${missionId}`).emit(EVENTS.PHASE_UPDATED, event)

  logger.info('Emitted phase updated', { event: EVENTS.PHASE_UPDATED, phaseId: phase.id, missionId })
}
