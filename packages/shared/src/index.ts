/**
 * @mcp-tracker/shared
 *
 * Shared types and Prisma client exports for MCP Workflow Tracker.
 * This package is the source of truth for database types.
 */

// Re-export Prisma client and types
// Note: With SQLite, enums are stored as strings (no native enum support)
export {
  PrismaClient,
  // Types
  type Workflow,
  type Task,
  type Decision,
  type Issue,
  type Milestone,
  type Prisma,
} from '@prisma/client'

// SQLite-compatible enum constants (stored as strings in DB)
export const WorkflowStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  PARTIAL_SUCCESS: 'PARTIAL_SUCCESS',
  FAILED: 'FAILED',
} as const

export const TaskStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  SUCCESS: 'SUCCESS',
  PARTIAL_SUCCESS: 'PARTIAL_SUCCESS',
  FAILED: 'FAILED',
} as const

export const DecisionCategory = {
  ARCHITECTURE: 'architecture',
  LIBRARY_CHOICE: 'library_choice',
  TRADE_OFF: 'trade_off',
  WORKAROUND: 'workaround',
  OTHER: 'other',
} as const

export const IssueType = {
  DOCUMENTATION_GAP: 'documentation_gap',
  BUG_ENCOUNTERED: 'bug_encountered',
  DEPENDENCY_CONFLICT: 'dependency_conflict',
  UNCLEAR_REQUIREMENT: 'unclear_requirement',
  OTHER: 'other',
} as const

export const TestsStatus = {
  PASSED: 'passed',
  FAILED: 'failed',
  NOT_RUN: 'not_run',
} as const

// Type helpers
export type WorkflowStatusType = typeof WorkflowStatus[keyof typeof WorkflowStatus]
export type TaskStatusType = typeof TaskStatus[keyof typeof TaskStatus]
export type DecisionCategoryType = typeof DecisionCategory[keyof typeof DecisionCategory]
export type IssueTypeType = typeof IssueType[keyof typeof IssueType]
export type TestsStatusType = typeof TestsStatus[keyof typeof TestsStatus]
