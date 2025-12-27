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
 * - **Database Models**: Workflow, Task, Decision, Issue, Milestone, Phase
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
 *     objective: 'Implement user authentication',
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
  type Phase,
} from '@prisma/client'

// ============================================
// ENUMS (re-exported from enums.ts)
// ============================================

export {
  WorkflowStatus,
  type WorkflowStatus as WorkflowStatusType,
  WorkflowProfile,
  type WorkflowProfile as WorkflowProfileType,
  TaskStatus,
  type TaskStatus as TaskStatusType,
  DecisionCategory,
  type DecisionCategory as DecisionCategoryType,
  IssueType,
  type IssueType as IssueTypeType,
  TestsStatus,
  type TestsStatus as TestsStatusType,
  PhaseStatus,
  type PhaseStatus as PhaseStatusType,
  CallerType,
  type CallerType as CallerTypeType,
} from './enums.js'

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
