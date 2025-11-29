/**
 * JSON Parse Helpers for SQLite
 *
 * SQLite stores arrays as JSON strings. These helpers safely parse them back to arrays.
 */

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
