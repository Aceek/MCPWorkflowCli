/**
 * JSON Field Helpers for SQLite
 *
 * SQLite doesn't support native arrays or JSON fields like PostgreSQL.
 * These helpers handle serialization/deserialization transparently.
 */

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
  } catch {
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
  } catch {
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

  if (fields.areas !== undefined) result.areas = toJsonArray(fields.areas)
  if (fields.achievements !== undefined) result.achievements = toJsonArray(fields.achievements)
  if (fields.limitations !== undefined) result.limitations = toJsonArray(fields.limitations)
  if (fields.nextSteps !== undefined) result.nextSteps = toJsonArray(fields.nextSteps)
  if (fields.packagesAdded !== undefined) result.packagesAdded = toJsonArray(fields.packagesAdded)
  if (fields.packagesRemoved !== undefined) result.packagesRemoved = toJsonArray(fields.packagesRemoved)
  if (fields.commandsExecuted !== undefined) result.commandsExecuted = toJsonArray(fields.commandsExecuted)
  if (fields.filesAdded !== undefined) result.filesAdded = toJsonArray(fields.filesAdded)
  if (fields.filesModified !== undefined) result.filesModified = toJsonArray(fields.filesModified)
  if (fields.filesDeleted !== undefined) result.filesDeleted = toJsonArray(fields.filesDeleted)
  if (fields.unexpectedFiles !== undefined) result.unexpectedFiles = toJsonArray(fields.unexpectedFiles)
  if (fields.warnings !== undefined) result.warnings = toJsonArray(fields.warnings)
  if (fields.snapshotData !== undefined) result.snapshotData = toJsonObject(fields.snapshotData)

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
  return {
    areas: fromJsonArray(task.areas),
    achievements: fromJsonArray(task.achievements),
    limitations: fromJsonArray(task.limitations),
    nextSteps: fromJsonArray(task.nextSteps),
    packagesAdded: fromJsonArray(task.packagesAdded),
    packagesRemoved: fromJsonArray(task.packagesRemoved),
    commandsExecuted: fromJsonArray(task.commandsExecuted),
    filesAdded: fromJsonArray(task.filesAdded),
    filesModified: fromJsonArray(task.filesModified),
    filesDeleted: fromJsonArray(task.filesDeleted),
    unexpectedFiles: fromJsonArray(task.unexpectedFiles),
    warnings: fromJsonArray(task.warnings),
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
  } catch {
    return null
  }
}
