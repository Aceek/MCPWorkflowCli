/**
 * Shared package for Mission Control
 *
 * @packageDocumentation
 * @module @mission-control/shared
 *
 * @description
 * This package serves as the **source of truth** for all database types and schemas
 * in the MCP Workflow Tracker monorepo. It provides:
 *
 * - **Prisma Client**: Database ORM for SQLite with type-safe queries
 * - **Database Models**: Workflow, Task, Decision, Issue, Milestone
 * - **Type-Safe Enums**: Status and category enums for application-level type safety
 *
 * ## Database Provider
 * - **SQLite**: Enums are stored as TEXT strings in the database
 * - **Type Safety**: Enums defined here ensure compile-time validation in TypeScript
 *
 * ## Package Usage
 * This package is consumed by:
 * - `mcp-server`: MCP protocol implementation (backend logic)
 * - `web-ui`: Next.js dashboard (frontend presentation)
 *
 * @example
 * ```typescript
 * import { PrismaClient, WorkflowStatus, TaskStatus } from '@mission-control/shared'
 *
 * const prisma = new PrismaClient()
 *
 * const workflow = await prisma.workflow.create({
 *   data: {
 *     name: 'Feature Implementation',
 *     status: WorkflowStatus.IN_PROGRESS
 *   }
 * })
 * ```
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
  type ServerInfo,
  type Mission,
  type Phase,
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

// ============================================
// MISSION SYSTEM ENUMS
// ============================================

export const MissionProfile = {
  SIMPLE: 'SIMPLE',     // 2 phases
  STANDARD: 'STANDARD', // 3 phases
  COMPLEX: 'COMPLEX',   // 4+ phases, parallel
} as const
export type MissionProfile = (typeof MissionProfile)[keyof typeof MissionProfile]

export const MissionStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  BLOCKED: 'BLOCKED', // Waiting for human intervention
} as const
export type MissionStatus = (typeof MissionStatus)[keyof typeof MissionStatus]

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

// ============================================
// ZOD VALIDATION SCHEMAS
// Centralized Zod schemas for type-safe validation
// ============================================

export * from './schemas.js'

// ============================================
// CONSTANTS
// Shared constants for enums, labels, and configuration
// ============================================

export * from './constants.js'

// ============================================
// LOGGER TYPES
// Type definitions only (implementations in mcp-server and web-ui)
// ============================================

export type { Logger, LogLevel, LogEntry, LoggerOptions } from './logger.js'
