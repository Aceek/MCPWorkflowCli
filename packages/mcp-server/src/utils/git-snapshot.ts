/**
 * Git Snapshot Utilities
 *
 * Handles Git-based snapshots for tracking file changes during task execution.
 * Falls back to checksum-based snapshots if not in a Git repository.
 */

import simpleGit, { type SimpleGit } from 'simple-git'
import { createHash } from 'crypto'
import { readFile } from 'fs/promises'
import { glob } from 'glob'
import { GitError } from './errors.js'

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

export interface GitDiffResult {
  added: string[]
  modified: string[]
  deleted: string[]
}

export interface ScopeVerificationResult {
  scopeMatch: boolean
  unexpectedFiles: string[]
  warnings: string[]
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
    console.error(
      '[git-snapshot] Failed to create Git snapshot, falling back to checksum:',
      error instanceof Error ? error.message : error
    )
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
      console.error(
        `[git-snapshot] Failed to read file for checksum (${file}):`,
        error instanceof Error ? error.message : error
      )
      // Skip files that can't be read
    }
  }

  return checksums
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
    console.error(
      `[git-snapshot] Failed to get committed diff from ${startHash} to HEAD:`,
      error instanceof Error ? error.message : error
    )
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
    console.error(
      '[git-snapshot] Failed to get working tree diff:',
      error instanceof Error ? error.message : error
    )
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
function parseDiffOutput(output: string): GitDiffResult {
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
function mergeDiffs(
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
