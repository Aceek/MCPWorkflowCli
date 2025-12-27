/**
 * Enum Type Conversions for MCP Workflow Tracker
 *
 * This module centralizes the conversion between MCP input formats (snake_case)
 * and application enums (SCREAMING_CASE).
 *
 * SQLite stores enums as strings. Type safety is provided by @mission-control/shared.
 */

import {
  WorkflowStatus,
  TaskStatus,
  DecisionCategory,
  IssueType,
  TestsStatus,
  CallerType,
} from '@mission-control/shared'

// ============================================
// WORKFLOW PROFILE (for mission-style workflows)
// ============================================

/**
 * Workflow profile enum
 * Defines complexity profiles for workflows
 */
export const WorkflowProfile = {
  SIMPLE: 'SIMPLE',     // 2 phases
  STANDARD: 'STANDARD', // 3 phases
  COMPLEX: 'COMPLEX',   // 4+ phases, parallel
} as const
export type WorkflowProfile = (typeof WorkflowProfile)[keyof typeof WorkflowProfile]

// ============================================
// CONVERSION MAPS (MCP Input -> Prisma Enum)
// ============================================

/**
 * Workflow profile conversion map
 * MCP input: 'simple' | 'standard' | 'complex'
 */
export const workflowProfileMap: Record<string, WorkflowProfile> = {
  simple: WorkflowProfile.SIMPLE,
  standard: WorkflowProfile.STANDARD,
  complex: WorkflowProfile.COMPLEX,
}

/**
 * Workflow status conversion map
 * MCP input: 'completed' | 'failed' | 'partial'
 * Prisma enum: WorkflowStatus
 */
export const workflowStatusMap: Record<string, WorkflowStatus> = {
  completed: WorkflowStatus.COMPLETED,
  failed: WorkflowStatus.FAILED,
  partial: WorkflowStatus.FAILED, // Partial success is treated as failed for workflow
}

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

/**
 * Caller type conversion map
 * MCP input: 'orchestrator' | 'subagent'
 * Prisma enum: CallerType
 */
export const callerTypeMap: Record<string, CallerType> = {
  orchestrator: CallerType.ORCHESTRATOR,
  subagent: CallerType.SUBAGENT,
}

// ============================================
// RE-EXPORTS (for direct usage)
// ============================================

export {
  WorkflowStatus,
  TaskStatus,
  DecisionCategory,
  IssueType,
  TestsStatus,
  CallerType,
}
