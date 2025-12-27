/**
 * Enum definitions for Mission Control
 *
 * This file contains all enum definitions to avoid circular dependencies.
 * Both index.ts and schemas.ts import from this file.
 *
 * @packageDocumentation
 * @module @mission-control/shared/enums
 */

// ============================================
// ENUMS (SQLite stores as strings)
// Defined here for type safety in the application
// ============================================

/**
 * Workflow status enum
 * - PENDING: Workflow created but not yet started
 * - IN_PROGRESS: Workflow is currently executing
 * - COMPLETED: Workflow finished successfully
 * - FAILED: Workflow failed
 * - BLOCKED: Workflow is waiting for human intervention
 */
export const WorkflowStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  BLOCKED: 'BLOCKED',
} as const
export type WorkflowStatus = (typeof WorkflowStatus)[keyof typeof WorkflowStatus]

/**
 * Workflow profile enum (complexity level)
 * - SIMPLE: 2 phases
 * - STANDARD: 3 phases
 * - COMPLEX: 4+ phases, parallel execution possible
 */
export const WorkflowProfile = {
  SIMPLE: 'SIMPLE',
  STANDARD: 'STANDARD',
  COMPLEX: 'COMPLEX',
} as const
export type WorkflowProfile = (typeof WorkflowProfile)[keyof typeof WorkflowProfile]

export const TaskStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  SUCCESS: 'SUCCESS',
  PARTIAL_SUCCESS: 'PARTIAL_SUCCESS',
  FAILED: 'FAILED',
} as const
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus]

export const DecisionCategory = {
  ARCHITECTURE: 'ARCHITECTURE',
  LIBRARY_CHOICE: 'LIBRARY_CHOICE',
  TRADE_OFF: 'TRADE_OFF',
  WORKAROUND: 'WORKAROUND',
  OTHER: 'OTHER',
} as const
export type DecisionCategory = (typeof DecisionCategory)[keyof typeof DecisionCategory]

export const IssueType = {
  DOC_GAP: 'DOC_GAP',
  BUG: 'BUG',
  DEPENDENCY_CONFLICT: 'DEPENDENCY_CONFLICT',
  UNCLEAR_REQUIREMENT: 'UNCLEAR_REQUIREMENT',
  OTHER: 'OTHER',
} as const
export type IssueType = (typeof IssueType)[keyof typeof IssueType]

export const TestsStatus = {
  PASSED: 'PASSED',
  FAILED: 'FAILED',
  NOT_RUN: 'NOT_RUN',
} as const
export type TestsStatus = (typeof TestsStatus)[keyof typeof TestsStatus]

export const PhaseStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const
export type PhaseStatus = (typeof PhaseStatus)[keyof typeof PhaseStatus]

export const CallerType = {
  ORCHESTRATOR: 'ORCHESTRATOR',
  SUBAGENT: 'SUBAGENT',
} as const
export type CallerType = (typeof CallerType)[keyof typeof CallerType]
