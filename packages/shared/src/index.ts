/**
 * @mcp-tracker/shared
 *
 * Shared types and Prisma client exports for MCP Workflow Tracker.
 * This package is the source of truth for database types.
 */

// Re-export Prisma client and types
export {
  PrismaClient,
  type Workflow,
  type Task,
  type Decision,
  type Issue,
  type Milestone,
  type Prisma,
} from '@prisma/client'

// ============================================
// ENUMS (SQLite stores as strings)
// Defined here for type safety in the application
// ============================================

export const WorkflowStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const
export type WorkflowStatus = (typeof WorkflowStatus)[keyof typeof WorkflowStatus]

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
