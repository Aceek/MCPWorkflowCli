/**
 * Git Snapshot Utilities
 *
 * Handles Git-based snapshots for tracking file changes during task execution.
 * Falls back to checksum-based snapshots if not in a Git repository.
 */

import simpleGit from 'simple-git'
import { createHash } from 'crypto'
import { readFile } from 'fs/promises'
import { glob } from 'glob'
import { createLogger } from './logger.js'

// Re-export from split modules for backward compatibility
export { computeGitDiff, type GitDiffResult } from './git-diff.js'
export { verifyScope, type ScopeVerificationResult } from './scope-verification.js'

/**
 * Logger instance for Git snapshot operations
 */
const logger = createLogger('git-snapshot')

export interface GitSnapshotResult {
  type: 'git' | 'checksum'
  id: string
  data: GitSnapshotData | ChecksumSnapshotData
}

export interface GitSnapshotData {
  gitHash: string
}

export interface ChecksumSnapshotData {
  checksums: Record<string, string>
}

/**
 * Create a Git snapshot of the current repository state.
 * Falls back to checksum-based snapshot if not a Git repository.
 */
export async function createGitSnapshot(
  workingDir?: string
): Promise<GitSnapshotResult> {
  const git = simpleGit(workingDir)

  try {
    const isGitRepo = await git.checkIsRepo()

    if (isGitRepo) {
      const hash = await git.revparse(['HEAD'])
      const trimmedHash = hash.trim()

      return {
        type: 'git',
        id: trimmedHash,
        data: { gitHash: trimmedHash },
      }
    }
  } catch (error) {
    logger.warn('Failed to create Git snapshot, falling back to checksum', {
      error: error instanceof Error ? error.message : String(error),
    })
    // Fall through to checksum snapshot
  }

  // Fallback: Checksum snapshot
  const checksums = await createChecksumSnapshot(workingDir)
  return {
    type: 'checksum',
    id: `checksum-${Date.now()}`,
    data: { checksums },
  }
}

/**
 * Create a checksum-based snapshot of source files.
 * Used when not in a Git repository.
 */
async function createChecksumSnapshot(
  workingDir?: string
): Promise<Record<string, string>> {
  const checksums: Record<string, string> = {}
  const cwd = workingDir ?? process.cwd()

  const files = await glob('**/*.{ts,tsx,js,jsx,json,md,prisma}', {
    cwd,
    ignore: ['node_modules/**', 'dist/**', '.git/**'],
  })

  for (const file of files) {
    try {
      const content = await readFile(`${cwd}/${file}`, 'utf-8')
      const hash = createHash('md5').update(content).digest('hex')
      checksums[file] = hash
    } catch (error) {
      logger.warn('Failed to read file for checksum', {
        file,
        error: error instanceof Error ? error.message : String(error),
      })
      // Skip files that can't be read
    }
  }

  return checksums
}
