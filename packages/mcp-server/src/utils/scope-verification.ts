/**
 * Scope Verification Utilities
 *
 * Verifies if modified files match declared scope areas.
 * Extracted from git-snapshot.ts for better maintainability.
 */

export interface ScopeVerificationResult {
  scopeMatch: boolean
  unexpectedFiles: string[]
  warnings: string[]
}

/**
 * Verify if modified files match declared scope areas.
 */
export function verifyScope(
  changedFiles: string[],
  areas: string[]
): ScopeVerificationResult {
  if (areas.length === 0) {
    // No scope declared, no verification needed
    return {
      scopeMatch: true,
      unexpectedFiles: [],
      warnings: [],
    }
  }

  const unexpectedFiles: string[] = []

  for (const file of changedFiles) {
    const matchesScope = areas.some((area) => {
      // Check if file path contains the area name
      const normalizedArea = area.toLowerCase()
      const normalizedFile = file.toLowerCase()
      return (
        normalizedFile.includes(normalizedArea) ||
        normalizedFile.includes(`/${normalizedArea}/`) ||
        normalizedFile.startsWith(`${normalizedArea}/`)
      )
    })

    if (!matchesScope) {
      unexpectedFiles.push(file)
    }
  }

  const scopeMatch = unexpectedFiles.length === 0
  const warnings: string[] = []

  if (!scopeMatch) {
    warnings.push(
      `${unexpectedFiles.length} file(s) modified outside declared scope (${areas.join(', ')})`
    )
  }

  return {
    scopeMatch,
    unexpectedFiles,
    warnings,
  }
}
