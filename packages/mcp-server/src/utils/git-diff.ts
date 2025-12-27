/**
 * Git Diff Utilities
 *
 * Handles computing and parsing Git diffs for tracking file changes.
 * Extracted from git-snapshot.ts for better maintainability.
 */

import simpleGit, { type SimpleGit } from 'simple-git'
import { GitError } from './errors.js'
import { createLogger } from './logger.js'

/**
 * Logger instance for Git diff operations
 */
const logger = createLogger('git-diff')

export interface GitDiffResult {
  added: string[]
  modified: string[]
  deleted: string[]
}

/**
 * Compute Git diff between start hash and current state.
 *
 * CRITICAL: This performs UNION of two diffs:
 * 1. Committed changes: startHash..HEAD
 * 2. Working tree changes: HEAD (unstaged + staged)
 *
 * This ensures we capture ALL changes made during the task.
 */
export async function computeGitDiff(
  startHash: string,
  workingDir?: string
): Promise<GitDiffResult> {
  const git = simpleGit(workingDir)

  try {
    // Check if it's a Git repo
    const isGitRepo = await git.checkIsRepo()
    if (!isGitRepo) {
      return { added: [], modified: [], deleted: [] }
    }

    // DIFF 1: Committed changes (startHash..HEAD)
    const committedDiff = await getCommittedDiff(git, startHash)

    // DIFF 2: Working tree changes (staged + unstaged)
    const workingTreeDiff = await getWorkingTreeDiff(git)

    // UNION of both diffs
    return mergeDiffs(committedDiff, workingTreeDiff)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new GitError(`Failed to compute Git diff: ${message}`)
  }
}

/**
 * Get diff of committed changes between startHash and HEAD.
 */
async function getCommittedDiff(
  git: SimpleGit,
  startHash: string
): Promise<GitDiffResult> {
  try {
    const currentHead = await git.revparse(['HEAD'])

    // If start hash equals current HEAD, no committed changes
    if (startHash.trim() === currentHead.trim()) {
      return { added: [], modified: [], deleted: [] }
    }

    const diff = await git.diff([startHash, 'HEAD', '--name-status'])
    return parseDiffOutput(diff)
  } catch (error) {
    logger.error('Failed to get committed diff', {
      startHash,
      targetHash: 'HEAD',
      error: error instanceof Error ? error.message : String(error),
    })
    // If diff fails (e.g., invalid hash), return empty
    return { added: [], modified: [], deleted: [] }
  }
}

/**
 * Get diff of working tree (staged + unstaged changes).
 */
async function getWorkingTreeDiff(git: SimpleGit): Promise<GitDiffResult> {
  try {
    // Get both staged and unstaged changes
    const stagedDiff = await git.diff(['--cached', '--name-status'])
    const unstagedDiff = await git.diff(['--name-status'])

    const stagedResult = parseDiffOutput(stagedDiff)
    const unstagedResult = parseDiffOutput(unstagedDiff)

    return mergeDiffs(stagedResult, unstagedResult)
  } catch (error) {
    logger.error('Failed to get working tree diff', {
      error: error instanceof Error ? error.message : String(error),
    })
    return { added: [], modified: [], deleted: [] }
  }
}

/**
 * Parse Git diff --name-status output.
 *
 * Format:
 * A\tfile.ts     (Added)
 * M\tfile.ts     (Modified)
 * D\tfile.ts     (Deleted)
 * R100\told\tnew (Renamed)
 */
export function parseDiffOutput(output: string): GitDiffResult {
  const result: GitDiffResult = {
    added: [],
    modified: [],
    deleted: [],
  }

  if (!output.trim()) {
    return result
  }

  const lines = output.trim().split('\n')

  for (const line of lines) {
    const parts = line.split('\t')
    const status = parts[0]
    const file = parts[1]

    if (!status || !file) continue

    if (status === 'A') {
      result.added.push(file)
    } else if (status === 'M') {
      result.modified.push(file)
    } else if (status === 'D') {
      result.deleted.push(file)
    } else if (status.startsWith('R')) {
      // Renamed: old file deleted, new file added
      result.deleted.push(file)
      const newFile = parts[2]
      if (newFile) {
        result.added.push(newFile)
      }
    }
  }

  return result
}

/**
 * Merge two GitDiffResults, removing duplicates.
 * For conflicting statuses, the latest (second diff) takes precedence.
 */
export function mergeDiffs(
  diff1: GitDiffResult,
  diff2: GitDiffResult
): GitDiffResult {
  const fileStatus = new Map<string, 'A' | 'M' | 'D'>()

  // Process first diff
  for (const file of diff1.added) {
    fileStatus.set(file, 'A')
  }
  for (const file of diff1.modified) {
    fileStatus.set(file, 'M')
  }
  for (const file of diff1.deleted) {
    fileStatus.set(file, 'D')
  }

  // Process second diff (overrides first)
  for (const file of diff2.added) {
    fileStatus.set(file, 'A')
  }
  for (const file of diff2.modified) {
    fileStatus.set(file, 'M')
  }
  for (const file of diff2.deleted) {
    fileStatus.set(file, 'D')
  }

  // Build result
  const result: GitDiffResult = {
    added: [],
    modified: [],
    deleted: [],
  }

  for (const [file, status] of fileStatus) {
    if (status === 'A') {
      result.added.push(file)
    } else if (status === 'M') {
      result.modified.push(file)
    } else if (status === 'D') {
      result.deleted.push(file)
    }
  }

  // Sort for consistent output
  result.added.sort()
  result.modified.sort()
  result.deleted.sort()

  return result
}
