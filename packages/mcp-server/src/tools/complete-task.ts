/**
 * complete_task MCP Tool
 *
 * Complete a task and compute file changes via Git diff.
 * This is the MOST CRITICAL tool - it calculates the union of committed + working tree changes.
 */

import { z } from 'zod'
import { prisma } from '../db.js'
import { TaskStatus, TestsStatus } from '@prisma/client'
import {
  computeGitDiff,
  verifyScope,
  type GitSnapshotData,
} from '../utils/git-snapshot.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

// Map input strings to Prisma enum values
const statusMap: Record<string, TaskStatus> = {
  success: TaskStatus.SUCCESS,
  partial_success: TaskStatus.PARTIAL_SUCCESS,
  failed: TaskStatus.FAILED,
}

const testsStatusMap: Record<string, TestsStatus> = {
  passed: TestsStatus.PASSED,
  failed: TestsStatus.FAILED,
  not_run: TestsStatus.NOT_RUN,
}

// Zod schema for validation
const completeTaskSchema = z.object({
  task_id: z.string().min(1),
  status: z.enum(['success', 'partial_success', 'failed']),
  outcome: z.object({
    summary: z.string().min(1),
    achievements: z.array(z.string()).optional(),
    limitations: z.array(z.string()).optional(),
    manual_review_needed: z.boolean().optional(),
    manual_review_reason: z.string().optional(),
    next_steps: z.array(z.string()).optional(),
  }),
  metadata: z
    .object({
      packages_added: z.array(z.string()).optional(),
      packages_removed: z.array(z.string()).optional(),
      commands_executed: z.array(z.string()).optional(),
      tests_status: z.enum(['passed', 'failed', 'not_run']).optional(),
    })
    .optional(),
})

// MCP Tool definition
export const completeTaskTool = {
  name: 'complete_task',
  description: 'Complete a task and compute file changes via Git diff',
  inputSchema: {
    type: 'object' as const,
    properties: {
      task_id: {
        type: 'string',
        description: 'Task ID to complete',
      },
      status: {
        type: 'string',
        enum: ['success', 'partial_success', 'failed'],
        description: 'Final status of the task',
      },
      outcome: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'Summary of what was accomplished (2-4 sentences)',
          },
          achievements: {
            type: 'array',
            items: { type: 'string' },
            description: 'Concrete achievements (empty array if none)',
          },
          limitations: {
            type: 'array',
            items: { type: 'string' },
            description: 'Limitations/compromises (empty array if none)',
          },
          manual_review_needed: {
            type: 'boolean',
            description: 'Does a human need to review before continuing?',
          },
          manual_review_reason: {
            type: 'string',
            description: 'Why manual review is needed',
          },
          next_steps: {
            type: 'array',
            items: { type: 'string' },
            description: 'Suggested next steps (optional)',
          },
        },
        required: ['summary'],
      },
      metadata: {
        type: 'object',
        properties: {
          packages_added: {
            type: 'array',
            items: { type: 'string' },
          },
          packages_removed: {
            type: 'array',
            items: { type: 'string' },
          },
          commands_executed: {
            type: 'array',
            items: { type: 'string' },
          },
          tests_status: {
            type: 'string',
            enum: ['passed', 'failed', 'not_run'],
          },
        },
      },
    },
    required: ['task_id', 'status', 'outcome'],
  },
}

// Handler
export async function handleCompleteTask(
  args: unknown
): Promise<CallToolResult> {
  // Validate input
  const validated = completeTaskSchema.parse(args)

  // Fetch task with snapshot data
  const task = await prisma.task.findUnique({
    where: { id: validated.task_id },
  })

  if (!task) {
    throw new NotFoundError(`Task not found: ${validated.task_id}`)
  }

  if (task.status !== TaskStatus.IN_PROGRESS) {
    throw new ValidationError(
      `Task is not in progress: ${task.status}`
    )
  }

  // Calculate completion time
  const completedAt = new Date()
  const durationMs = completedAt.getTime() - task.startedAt.getTime()

  // Compute Git diff (CRITICAL: Union of committed + working tree changes)
  let filesAdded: string[] = []
  let filesModified: string[] = []
  let filesDeleted: string[] = []

  if (task.snapshotType === 'git' && task.snapshotData) {
    const snapshotData = task.snapshotData as unknown as GitSnapshotData
    const diff = await computeGitDiff(snapshotData.gitHash)
    filesAdded = diff.added
    filesModified = diff.modified
    filesDeleted = diff.deleted
  }

  // Verify scope
  const allChangedFiles = [...filesAdded, ...filesModified, ...filesDeleted]
  const scopeVerification = verifyScope(allChangedFiles, task.areas)

  // Map status to Prisma enum
  const taskStatus = statusMap[validated.status]
  if (!taskStatus) {
    throw new Error(`Invalid status: ${validated.status}`)
  }

  // Map tests status if provided
  let testsStatus: TestsStatus | undefined
  if (validated.metadata?.tests_status) {
    testsStatus = testsStatusMap[validated.metadata.tests_status]
  }

  // Update task in database
  const updatedTask = await prisma.task.update({
    where: { id: validated.task_id },
    data: {
      status: taskStatus,
      completedAt,
      durationMs,
      summary: validated.outcome.summary,
      achievements: validated.outcome.achievements ?? [],
      limitations: validated.outcome.limitations ?? [],
      manualReviewNeeded: validated.outcome.manual_review_needed ?? false,
      manualReviewReason: validated.outcome.manual_review_reason,
      nextSteps: validated.outcome.next_steps ?? [],
      packagesAdded: validated.metadata?.packages_added ?? [],
      packagesRemoved: validated.metadata?.packages_removed ?? [],
      commandsExecuted: validated.metadata?.commands_executed ?? [],
      testsStatus,
      filesAdded,
      filesModified,
      filesDeleted,
      scopeMatch: scopeVerification.scopeMatch,
      unexpectedFiles: scopeVerification.unexpectedFiles,
      warnings: scopeVerification.warnings,
    },
  })

  // Check if workflow should be completed
  // (All tasks in workflow are complete)
  await checkAndUpdateWorkflowStatus(task.workflowId)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            task_id: updatedTask.id,
            duration_seconds: Math.round(durationMs / 1000),
            files_changed: {
              added: filesAdded,
              modified: filesModified,
              deleted: filesDeleted,
            },
            verification: {
              scope_match: scopeVerification.scopeMatch,
              unexpected_files: scopeVerification.unexpectedFiles,
              warnings: scopeVerification.warnings,
            },
          },
          null,
          2
        ),
      },
    ],
  }
}

/**
 * Check if all tasks in a workflow are complete and update workflow status.
 */
async function checkAndUpdateWorkflowStatus(
  workflowId: string
): Promise<void> {
  const tasks = await prisma.task.findMany({
    where: { workflowId },
    select: { status: true },
  })

  // Check if all tasks are complete (not IN_PROGRESS)
  const allComplete = tasks.every(
    (task) => task.status !== TaskStatus.IN_PROGRESS
  )

  if (allComplete && tasks.length > 0) {
    // Check if any task failed
    const anyFailed = tasks.some((task) => task.status === TaskStatus.FAILED)

    await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        status: anyFailed ? 'FAILED' : 'COMPLETED',
      },
    })
  }
}
