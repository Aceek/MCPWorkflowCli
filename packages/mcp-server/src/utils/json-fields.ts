/**
 * JSON Field Helpers for SQLite
 *
 * SQLite doesn't support native arrays or JSON fields like PostgreSQL.
 * These helpers handle serialization/deserialization transparently.
 */

import { createLogger } from './logger.js'

/**
 * Logger instance for JSON field operations
 */
const logger = createLogger('json-fields')

/**
 * Serialize an array to JSON string for SQLite storage
 */
export function toJsonArray<T>(arr: T[] | undefined | null): string {
  if (!arr || arr.length === 0) return '[]'
  return JSON.stringify(arr)
}

/**
 * Parse a JSON string back to array
 */
export function fromJsonArray<T>(json: string | null | undefined): T[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    logger.warn('Failed to parse JSON array, returning empty array', {
      json: json.substring(0, 100), // Limite pour éviter les logs trop longs
      error: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}

/**
 * Serialize an object to JSON string for SQLite storage
 */
export function toJsonObject<T extends object>(obj: T | undefined | null): string | null {
  if (!obj) return null
  return JSON.stringify(obj)
}

/**
 * Parse a JSON string back to object
 */
export function fromJsonObject<T extends object>(json: string | null | undefined): T | null {
  if (!json) return null
  try {
    return JSON.parse(json) as T
  } catch (error) {
    logger.warn('Failed to parse JSON object, returning null', {
      json: json.substring(0, 100),
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

/**
 * Helper type for Task fields that need JSON conversion
 */
export interface TaskJsonFields {
  areas: string
  achievements: string
  limitations: string
  nextSteps: string
  packagesAdded: string
  packagesRemoved: string
  commandsExecuted: string
  filesAdded: string
  filesModified: string
  filesDeleted: string
  unexpectedFiles: string
  warnings: string
  snapshotData: string | null
}

/**
 * Task array field names that need JSON conversion
 */
const TASK_ARRAY_FIELDS = [
  'areas',
  'achievements',
  'limitations',
  'nextSteps',
  'packagesAdded',
  'packagesRemoved',
  'commandsExecuted',
  'filesAdded',
  'filesModified',
  'filesDeleted',
  'unexpectedFiles',
  'warnings',
] as const

type TaskArrayField = (typeof TASK_ARRAY_FIELDS)[number]

/**
 * Convert Task arrays to JSON strings for SQLite insert/update
 */
export function taskFieldsToJson(fields: {
  areas?: string[]
  achievements?: string[]
  limitations?: string[]
  nextSteps?: string[]
  packagesAdded?: string[]
  packagesRemoved?: string[]
  commandsExecuted?: string[]
  filesAdded?: string[]
  filesModified?: string[]
  filesDeleted?: string[]
  unexpectedFiles?: string[]
  warnings?: string[]
  snapshotData?: Record<string, unknown> | null
}): Partial<TaskJsonFields> {
  const result: Partial<TaskJsonFields> = {}

  // Process array fields using the constant list
  for (const field of TASK_ARRAY_FIELDS) {
    const value = fields[field]
    if (value !== undefined) {
      result[field] = toJsonArray(value)
    }
  }

  // Handle snapshotData separately (object, not array)
  if (fields.snapshotData !== undefined) {
    result.snapshotData = toJsonObject(fields.snapshotData)
  }

  return result
}

/**
 * Convert Task JSON strings back to arrays for API response
 */
export function taskFieldsFromJson(task: {
  areas?: string | null
  achievements?: string | null
  limitations?: string | null
  nextSteps?: string | null
  packagesAdded?: string | null
  packagesRemoved?: string | null
  commandsExecuted?: string | null
  filesAdded?: string | null
  filesModified?: string | null
  filesDeleted?: string | null
  unexpectedFiles?: string | null
  warnings?: string | null
  snapshotData?: string | null
}): {
  areas: string[]
  achievements: string[]
  limitations: string[]
  nextSteps: string[]
  packagesAdded: string[]
  packagesRemoved: string[]
  commandsExecuted: string[]
  filesAdded: string[]
  filesModified: string[]
  filesDeleted: string[]
  unexpectedFiles: string[]
  warnings: string[]
  snapshotData: Record<string, unknown> | null
} {
  // Build result using the constant list for array fields
  const result = {} as Record<TaskArrayField, string[]>
  for (const field of TASK_ARRAY_FIELDS) {
    result[field] = fromJsonArray(task[field])
  }

  return {
    ...result,
    snapshotData: fromJsonObject(task.snapshotData),
  }
}

/**
 * Helper for Decision fields
 */
export function decisionFieldsToJson(fields: {
  optionsConsidered?: string[]
}): { optionsConsidered: string } {
  return {
    optionsConsidered: toJsonArray(fields.optionsConsidered),
  }
}

export function decisionFieldsFromJson(decision: {
  optionsConsidered?: string | null
}): { optionsConsidered: string[] } {
  return {
    optionsConsidered: fromJsonArray(decision.optionsConsidered),
  }
}

/**
 * Helper for Workflow plan field (JSON object)
 */
export function workflowPlanToJson(plan: unknown[] | null | undefined): string | null {
  if (!plan) return null
  return JSON.stringify(plan)
}

export function workflowPlanFromJson(plan: string | null | undefined): unknown[] | null {
  if (!plan) return null
  try {
    return JSON.parse(plan)
  } catch (error) {
    logger.warn('Failed to parse workflow plan, returning null', {
      plan: plan.substring(0, 100),
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}
