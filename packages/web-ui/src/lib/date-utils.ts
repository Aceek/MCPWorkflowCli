/**
 * Date and time formatting utilities
 */

/**
 * Format a date for display
 * @param date - Date string or Date object
 * @returns Formatted date string (e.g., "15 janv. 2025, 10:30")
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'Date invalide'

  const d = typeof date === 'string' ? new Date(date) : date

  if (isNaN(d.getTime())) {
    return 'Date invalide'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * Format a duration in milliseconds to human-readable string
 * @param ms - Duration in milliseconds
 * @returns Formatted duration (e.g., "2h 30m", "45s", "1h 5m")
 */
export function formatDuration(ms: number | null | undefined): string {
  if (!ms) return '-'

  const seconds = Math.floor(ms / 1000)

  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)

  if (minutes < 60) {
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}
