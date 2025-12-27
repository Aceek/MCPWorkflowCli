/**
 * Shared Constants for MCP Workflow Tracker
 *
 * This module provides centralized constants for enum values, labels, and configuration.
 * These constants are shared across all packages (mcp-server, web-ui).
 *
 * @packageDocumentation
 * @module @mission-control/shared/constants
 */

// ============================================
// ENUM VALUE ARRAYS (for iteration/filtering)
// ============================================

/**
 * All possible workflow status values
 */
export const WORKFLOW_STATUSES = [
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
] as const

/**
 * All possible task status values
 */
export const TASK_STATUSES = [
  'IN_PROGRESS',
  'SUCCESS',
  'PARTIAL_SUCCESS',
  'FAILED',
] as const

/**
 * All possible decision category values
 */
export const DECISION_CATEGORIES = [
  'ARCHITECTURE',
  'LIBRARY_CHOICE',
  'TRADE_OFF',
  'WORKAROUND',
  'OTHER',
] as const

/**
 * All possible issue type values
 */
export const ISSUE_TYPES = [
  'DOC_GAP',
  'BUG',
  'DEPENDENCY_CONFLICT',
  'UNCLEAR_REQUIREMENT',
  'OTHER',
] as const

/**
 * All possible tests status values
 */
export const TESTS_STATUSES = ['PASSED', 'FAILED', 'NOT_RUN'] as const

// ============================================
// WORKFLOW EXTENDED ENUM VALUE ARRAYS
// ============================================

/**
 * All possible workflow profile values
 */
export const WORKFLOW_PROFILES = ['SIMPLE', 'STANDARD', 'COMPLEX'] as const

/**
 * All possible workflow status values (full set including PENDING/BLOCKED)
 */
export const WORKFLOW_STATUSES_FULL = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
  'BLOCKED',
] as const

/**
 * All possible phase status values
 */
export const PHASE_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
] as const

/**
 * All possible caller type values
 */
export const CALLER_TYPES = ['ORCHESTRATOR', 'SUBAGENT'] as const

// ============================================
// DISPLAY LABELS (for UI)
// ============================================

/**
 * Human-readable labels for workflow statuses
 */
export const WORKFLOW_STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
}

/**
 * Human-readable labels for task statuses
 */
export const TASK_STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: 'In Progress',
  SUCCESS: 'Success',
  PARTIAL_SUCCESS: 'Partial Success',
  FAILED: 'Failed',
}

/**
 * Human-readable labels for decision categories
 */
export const DECISION_CATEGORY_LABELS: Record<string, string> = {
  ARCHITECTURE: 'Architecture',
  LIBRARY_CHOICE: 'Library Choice',
  TRADE_OFF: 'Trade-off',
  WORKAROUND: 'Workaround',
  OTHER: 'Other',
}

/**
 * Human-readable labels for issue types
 */
export const ISSUE_TYPE_LABELS: Record<string, string> = {
  DOC_GAP: 'Documentation Gap',
  BUG: 'Bug',
  DEPENDENCY_CONFLICT: 'Dependency Conflict',
  UNCLEAR_REQUIREMENT: 'Unclear Requirement',
  OTHER: 'Other',
}

/**
 * Human-readable labels for tests statuses
 */
export const TESTS_STATUS_LABELS: Record<string, string> = {
  PASSED: 'Passed',
  FAILED: 'Failed',
  NOT_RUN: 'Not Run',
}

// ============================================
// WORKFLOW EXTENDED DISPLAY LABELS
// ============================================

/**
 * Human-readable labels for workflow profiles
 */
export const WORKFLOW_PROFILE_LABELS: Record<string, string> = {
  SIMPLE: 'Simple',
  STANDARD: 'Standard',
  COMPLEX: 'Complex',
}

/**
 * Human-readable labels for workflow statuses (full set)
 */
export const WORKFLOW_STATUS_LABELS_FULL: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  BLOCKED: 'Blocked',
}

/**
 * Human-readable labels for phase statuses
 */
export const PHASE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
}

/**
 * Human-readable labels for caller types
 */
export const CALLER_TYPE_LABELS: Record<string, string> = {
  ORCHESTRATOR: 'Orchestrator',
  SUBAGENT: 'Sub-agent',
}

// ============================================
// STATUS COLORS (for UI theming)
// ============================================

/**
 * Tailwind CSS color classes for workflow statuses
 */
export const WORKFLOW_STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: 'bg-blue-500 text-white',
  COMPLETED: 'bg-green-500 text-white',
  FAILED: 'bg-red-500 text-white',
}

/**
 * Tailwind CSS color classes for task statuses
 */
export const TASK_STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: 'bg-blue-500 text-white',
  SUCCESS: 'bg-green-500 text-white',
  PARTIAL_SUCCESS: 'bg-yellow-500 text-white',
  FAILED: 'bg-red-500 text-white',
}

/**
 * Tailwind CSS color classes for tests statuses
 */
export const TESTS_STATUS_COLORS: Record<string, string> = {
  PASSED: 'bg-green-500 text-white',
  FAILED: 'bg-red-500 text-white',
  NOT_RUN: 'bg-gray-500 text-white',
}

// ============================================
// WORKFLOW EXTENDED STATUS COLORS
// ============================================

/**
 * Tailwind CSS color classes for workflow profiles
 */
export const WORKFLOW_PROFILE_COLORS: Record<string, string> = {
  SIMPLE: 'bg-gray-500 text-white',
  STANDARD: 'bg-blue-500 text-white',
  COMPLEX: 'bg-purple-500 text-white',
}

/**
 * Tailwind CSS color classes for workflow statuses (full set)
 */
export const WORKFLOW_STATUS_COLORS_FULL: Record<string, string> = {
  PENDING: 'bg-gray-500 text-white',
  IN_PROGRESS: 'bg-blue-500 text-white',
  COMPLETED: 'bg-green-500 text-white',
  FAILED: 'bg-red-500 text-white',
  BLOCKED: 'bg-orange-500 text-white',
}

/**
 * Tailwind CSS color classes for phase statuses
 */
export const PHASE_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-500 text-white',
  IN_PROGRESS: 'bg-blue-500 text-white',
  COMPLETED: 'bg-green-500 text-white',
  FAILED: 'bg-red-500 text-white',
}

/**
 * Tailwind CSS color classes for caller types
 */
export const CALLER_TYPE_COLORS: Record<string, string> = {
  ORCHESTRATOR: 'bg-indigo-500 text-white',
  SUBAGENT: 'bg-teal-500 text-white',
}

// ============================================
// MCP CONFIGURATION
// ============================================

/**
 * MCP Server metadata
 */
export const MCP_SERVER_NAME = 'workflow-control'
export const MCP_SERVER_VERSION = '0.1.0'

/**
 * Maximum values for tracking
 */
export const MAX_WORKFLOW_NAME_LENGTH = 200
export const MAX_TASK_NAME_LENGTH = 200
export const MAX_MILESTONES_PER_TASK = 100 // Practical limit to avoid performance issues

/**
 * Default values
 */
export const DEFAULT_PAGE_SIZE = 20
export const DEFAULT_STALE_TIME_MS = 5 * 60 * 1000 // 5 minutes
