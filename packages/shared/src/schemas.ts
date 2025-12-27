/**
 * Zod Validation Schemas for MCP Workflow Tracker
 *
 * This module provides centralized Zod schemas for all enum types and common data structures.
 * These schemas ensure type-safe validation at the application boundaries (e.g., MCP tool inputs).
 *
 * @packageDocumentation
 * @module @mission-control/shared/schemas
 */

import { z } from 'zod'
import {
  WorkflowStatus,
  WorkflowProfile,
  TaskStatus,
  PhaseStatus,
  DecisionCategory,
  IssueType,
  TestsStatus,
} from './enums.js'

// ============================================
// ENUM SCHEMAS (derived from enum objects using z.nativeEnum)
// ============================================

/**
 * Workflow status enum values
 * - PENDING: Workflow created but not yet started
 * - IN_PROGRESS: Workflow is currently executing
 * - COMPLETED: Workflow finished successfully
 * - FAILED: Workflow failed
 * - BLOCKED: Workflow is waiting for human intervention
 */
export const WorkflowStatusSchema = z.nativeEnum(WorkflowStatus)
export type WorkflowStatusEnum = z.infer<typeof WorkflowStatusSchema>

/**
 * Workflow profile enum values (complexity level)
 * - SIMPLE: 2 phases
 * - STANDARD: 3 phases
 * - COMPLEX: 4+ phases, parallel execution possible
 */
export const WorkflowProfileSchema = z.nativeEnum(WorkflowProfile)
export type WorkflowProfileEnum = z.infer<typeof WorkflowProfileSchema>

/**
 * Task status enum values
 * - IN_PROGRESS: Task is currently executing
 * - SUCCESS: Task completed successfully
 * - PARTIAL_SUCCESS: Task completed with compromises
 * - FAILED: Task failed
 */
export const TaskStatusSchema = z.nativeEnum(TaskStatus)
export type TaskStatusEnum = z.infer<typeof TaskStatusSchema>

/**
 * Phase status enum values
 * - PENDING: Phase not yet started
 * - IN_PROGRESS: Phase is currently executing
 * - COMPLETED: Phase finished successfully
 * - FAILED: Phase failed
 */
export const PhaseStatusSchema = z.nativeEnum(PhaseStatus)
export type PhaseStatusEnum = z.infer<typeof PhaseStatusSchema>

/**
 * Decision category enum values
 * - ARCHITECTURE: Architectural design decision
 * - LIBRARY_CHOICE: Technology/library selection
 * - TRADE_OFF: Compromise between competing concerns
 * - WORKAROUND: Temporary fix or workaround
 * - OTHER: Other types of decisions
 */
export const DecisionCategorySchema = z.nativeEnum(DecisionCategory)
export type DecisionCategoryEnum = z.infer<typeof DecisionCategorySchema>

/**
 * Issue type enum values
 * - DOC_GAP: Missing or unclear documentation
 * - BUG: Bug encountered during implementation
 * - DEPENDENCY_CONFLICT: Conflicting dependencies
 * - UNCLEAR_REQUIREMENT: Ambiguous requirements
 * - OTHER: Other types of issues
 */
export const IssueTypeSchema = z.nativeEnum(IssueType)
export type IssueTypeEnum = z.infer<typeof IssueTypeSchema>

/**
 * Tests status enum values
 * - PASSED: All tests passed
 * - FAILED: Some tests failed
 * - NOT_RUN: Tests were not executed
 */
export const TestsStatusSchema = z.nativeEnum(TestsStatus)
export type TestsStatusEnum = z.infer<typeof TestsStatusSchema>

// ============================================
// MCP INPUT SCHEMAS (snake_case variants)
// ============================================

/**
 * MCP input schema for workflow status (snake_case)
 * Maps to WorkflowStatusSchema internally
 */
export const WorkflowStatusInputSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'failed',
  'blocked',
])
export type WorkflowStatusInput = z.infer<typeof WorkflowStatusInputSchema>

/**
 * MCP input schema for workflow profile (snake_case)
 * Maps to WorkflowProfileSchema internally
 */
export const WorkflowProfileInputSchema = z.enum(['simple', 'standard', 'complex'])
export type WorkflowProfileInput = z.infer<typeof WorkflowProfileInputSchema>

/**
 * MCP input schema for task status (snake_case)
 * Maps to TaskStatusSchema internally
 */
export const TaskStatusInputSchema = z.enum([
  'success',
  'partial_success',
  'failed',
])
export type TaskStatusInput = z.infer<typeof TaskStatusInputSchema>

/**
 * MCP input schema for phase status (snake_case)
 * Maps to PhaseStatusSchema internally
 */
export const PhaseStatusInputSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'failed',
])
export type PhaseStatusInput = z.infer<typeof PhaseStatusInputSchema>

/**
 * MCP input schema for decision category (snake_case)
 * Maps to DecisionCategorySchema internally
 */
export const DecisionCategoryInputSchema = z.enum([
  'architecture',
  'library_choice',
  'trade_off',
  'workaround',
  'other',
])
export type DecisionCategoryInput = z.infer<typeof DecisionCategoryInputSchema>

/**
 * MCP input schema for issue type (snake_case)
 * Maps to IssueTypeSchema internally
 */
export const IssueTypeInputSchema = z.enum([
  'documentation_gap',
  'bug_encountered',
  'dependency_conflict',
  'unclear_requirement',
  'other',
])
export type IssueTypeInput = z.infer<typeof IssueTypeInputSchema>

/**
 * MCP input schema for tests status (snake_case)
 * Maps to TestsStatusSchema internally
 */
export const TestsStatusInputSchema = z.enum(['passed', 'failed', 'not_run'])
export type TestsStatusInput = z.infer<typeof TestsStatusInputSchema>

// ============================================
// DATA STRUCTURE SCHEMAS
// ============================================

/**
 * Schema for workflow plan step
 * Each step has a step number/identifier and a goal description
 */
export const WorkflowPlanStepSchema = z.object({
  step: z.string(),
  goal: z.string(),
})
export type WorkflowPlanStep = z.infer<typeof WorkflowPlanStepSchema>

/**
 * Schema for workflow plan (array of steps)
 *
 * @example
 * [
 *   { step: "1", goal: "Setup infrastructure" },
 *   { step: "2", goal: "Implement features" }
 * ]
 */
export const WorkflowPlanSchema = z.array(WorkflowPlanStepSchema)
export type WorkflowPlan = z.infer<typeof WorkflowPlanSchema>

/**
 * Schema for simple string arrays
 * Used for: areas, warnings, files, achievements, limitations, etc.
 *
 * @example
 * ["backend/auth", "frontend/login"]
 */
export const StringArraySchema = z.array(z.string())
export type StringArray = z.infer<typeof StringArraySchema>

/**
 * Schema for snapshot data (Git or checksum-based)
 */
export const SnapshotDataSchema = z.union([
  z.object({
    gitHash: z.string(),
  }),
  z.object({
    checksums: z.record(z.string(), z.string()),
  }),
])
export type SnapshotData = z.infer<typeof SnapshotDataSchema>
