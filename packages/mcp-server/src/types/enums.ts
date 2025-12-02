/**
 * Enum Type Conversions for MCP Workflow Tracker
 *
 * This module centralizes the conversion between MCP input formats (snake_case)
 * and application enums (SCREAMING_CASE).
 *
 * SQLite stores enums as strings. Type safety is provided by @mcp-tracker/shared.
 */

import {
  WorkflowStatus,
  TaskStatus,
  DecisionCategory,
  IssueType,
  TestsStatus,
} from '@mcp-tracker/shared'

// ============================================
// CONVERSION MAPS (MCP Input -> Prisma Enum)
// ============================================

/**
 * Task status conversion map
 * MCP input: 'success' | 'partial_success' | 'failed'
 * Prisma enum: TaskStatus
 */
export const taskStatusMap: Record<string, TaskStatus> = {
  success: TaskStatus.SUCCESS,
  partial_success: TaskStatus.PARTIAL_SUCCESS,
  failed: TaskStatus.FAILED,
}

/**
 * Decision category conversion map
 * MCP input: 'architecture' | 'library_choice' | 'trade_off' | 'workaround' | 'other'
 * Prisma enum: DecisionCategory
 */
export const decisionCategoryMap: Record<string, DecisionCategory> = {
  architecture: DecisionCategory.ARCHITECTURE,
  library_choice: DecisionCategory.LIBRARY_CHOICE,
  trade_off: DecisionCategory.TRADE_OFF,
  workaround: DecisionCategory.WORKAROUND,
  other: DecisionCategory.OTHER,
}

/**
 * Issue type conversion map
 * MCP input: 'documentation_gap' | 'bug_encountered' | 'dependency_conflict' | 'unclear_requirement' | 'other'
 * Prisma enum: IssueType
 */
export const issueTypeMap: Record<string, IssueType> = {
  documentation_gap: IssueType.DOC_GAP,
  bug_encountered: IssueType.BUG,
  dependency_conflict: IssueType.DEPENDENCY_CONFLICT,
  unclear_requirement: IssueType.UNCLEAR_REQUIREMENT,
  other: IssueType.OTHER,
}

/**
 * Tests status conversion map
 * MCP input: 'passed' | 'failed' | 'not_run'
 * Prisma enum: TestsStatus
 */
export const testsStatusMap: Record<string, TestsStatus> = {
  passed: TestsStatus.PASSED,
  failed: TestsStatus.FAILED,
  not_run: TestsStatus.NOT_RUN,
}

// ============================================
// RE-EXPORTS (for direct usage)
// ============================================

export { WorkflowStatus, TaskStatus, DecisionCategory, IssueType, TestsStatus }
