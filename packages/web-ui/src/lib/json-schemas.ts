/**
 * Zod Schemas for JSON Validation
 *
 * Provides type-safe validation for critical JSON structures stored in SQLite.
 */

import { z } from 'zod'

/**
 * Schema for workflow plan (array of steps with goals)
 *
 * @example
 * [
 *   { step: "1", goal: "Setup infrastructure" },
 *   { step: "2", goal: "Implement features" }
 * ]
 */
export const WorkflowPlanSchema = z.array(
  z.object({
    step: z.string(),
    goal: z.string(),
  })
)

/**
 * Schema for simple string arrays
 *
 * Used for: areas, warnings, files, etc.
 *
 * @example
 * ["backend", "frontend"]
 */
export const StringArraySchema = z.array(z.string())

/**
 * Type inference from schemas
 */
export type WorkflowPlan = z.infer<typeof WorkflowPlanSchema>
export type StringArray = z.infer<typeof StringArraySchema>
