/**
 * WebSocket Module
 *
 * Re-exports WebSocket server and event utilities.
 */

export { getWebSocketServer, getIO } from './server.js'
export {
  EVENTS,
  emitWorkflowCreated,
  emitWorkflowUpdated,
  emitTaskCreated,
  emitTaskUpdated,
  emitDecisionCreated,
  emitIssueCreated,
  emitMilestoneCreated,
} from './events.js'
export type {
  EventName,
  WorkflowCreatedEvent,
  WorkflowUpdatedEvent,
  TaskCreatedEvent,
  TaskUpdatedEvent,
  DecisionCreatedEvent,
  IssueCreatedEvent,
  MilestoneCreatedEvent,
} from './events.js'
