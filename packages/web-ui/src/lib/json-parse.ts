/**
 * JSON Parse Helpers for SQLite
 *
 * SQLite stores arrays as JSON strings. These helpers safely parse them back to arrays.
 */

import { z } from 'zod'

/**
 * Parse a JSON string to array, returns empty array if invalid
 */
export function parseJsonArray<T = string>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (typeof value !== 'string') return []
  if (!value || value === '[]') return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Parse a JSON string to object, returns null if invalid
 */
export function parseJsonObject<T = Record<string, unknown>>(
  value: unknown
): T | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as T
  }
  if (typeof value !== 'string') return null
  if (!value) return null

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

/**
 * Parse a JSON string to array with Zod validation
 *
 * Validates the parsed array against the provided schema. Returns empty array if invalid.
 *
 * @param value - The value to parse (string or already parsed array)
 * @param schema - Zod schema to validate against
 * @returns Validated array or empty array if invalid
 *
 * @example
 * const plan = parseJsonArraySafe(workflow.plan, WorkflowPlanSchema)
 */
export function parseJsonArraySafe<T>(
  value: unknown,
  schema: z.ZodSchema<T[]>
): T[] {
  // First, parse as regular array
  let parsed: unknown

  if (Array.isArray(value)) {
    parsed = value
  } else if (typeof value === 'string' && value && value !== '[]') {
    try {
      parsed = JSON.parse(value)
    } catch {
      return []
    }
  } else {
    return []
  }

  // Validate with Zod schema
  const result = schema.safeParse(parsed)

  if (!result.success) {
    if (typeof window !== 'undefined') {
      console.warn('JSON array validation failed:', result.error.format())
    }
    return []
  }

  return result.data
}

/**
 * Parse a JSON string to object with Zod validation
 *
 * Validates the parsed object against the provided schema. Returns null if invalid.
 *
 * @param value - The value to parse (string or already parsed object)
 * @param schema - Zod schema to validate against
 * @returns Validated object or null if invalid
 *
 * @example
 * const metadata = parseJsonObjectSafe(task.metadata, MetadataSchema)
 */
export function parseJsonObjectSafe<T>(
  value: unknown,
  schema: z.ZodSchema<T>
): T | null {
  // First, parse as regular object
  let parsed: unknown

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    parsed = value
  } else if (typeof value === 'string' && value) {
    try {
      parsed = JSON.parse(value)
    } catch {
      return null
    }
  } else {
    return null
  }

  // Validate with Zod schema
  const result = schema.safeParse(parsed)

  if (!result.success) {
    if (typeof window !== 'undefined') {
      console.warn('JSON object validation failed:', result.error.format())
    }
    return null
  }

  return result.data
}
