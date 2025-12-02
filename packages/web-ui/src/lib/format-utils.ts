/**
 * Number and token formatting utilities
 */

/**
 * Format token count with thousands separators
 * @param tokens - Number of tokens
 * @returns Formatted string (e.g., "1,234,567" or "1.2M")
 */
export function formatTokens(tokens: number | null | undefined): string {
  if (tokens === null || tokens === undefined || tokens === 0) {
    return '-'
  }

  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`
  }

  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}k`
  }

  return tokens.toString()
}
