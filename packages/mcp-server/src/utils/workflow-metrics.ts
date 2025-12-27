/**
 * Workflow Metrics Utilities
 *
 * Handles workflow status transitions and aggregated metrics computation.
 * Extracted from complete-task.ts to improve maintainability.
 */

import { prisma } from '../db.js'
import { TaskStatus, WorkflowStatus } from '../types/enums.js'

/**
 * Task data required for metrics computation
 * Note: status is string because Prisma returns string for enums in SQLite
 */
interface TaskMetricsData {
  status: string
  durationMs: number | null
  tokensInput: number | null
  tokensOutput: number | null
}

/**
 * Aggregated workflow metrics
 */
export interface WorkflowMetrics {
  totalDurationMs: number
  totalTokens: number
}

/**
 * Compute aggregated metrics from tasks.
 */
export function computeWorkflowMetrics(tasks: TaskMetricsData[]): WorkflowMetrics {
  let totalDurationMs = 0
  let totalTokens = 0

  for (const task of tasks) {
    if (task.durationMs) {
      totalDurationMs += task.durationMs
    }
    if (task.tokensInput) {
      totalTokens += task.tokensInput
    }
    if (task.tokensOutput) {
      totalTokens += task.tokensOutput
    }
  }

  return { totalDurationMs, totalTokens }
}

/**
 * Check if all tasks in a workflow are complete and update workflow status.
 * Also computes aggregated metrics (totalDurationMs, totalTokens).
 *
 * Status logic:
 * - If ANY task is IN_PROGRESS -> workflow stays IN_PROGRESS
 * - If ANY task is FAILED -> workflow is FAILED
 * - If ANY task is PARTIAL_SUCCESS (and none FAILED) -> workflow is FAILED
 * - If ALL tasks are SUCCESS -> workflow is COMPLETED
 *
 * Returns the updated workflow if status changed, null otherwise.
 */
export async function checkAndUpdateWorkflowStatus(
  workflowId: string
): Promise<Awaited<ReturnType<typeof prisma.workflow.update>> | null> {
  const tasks = await prisma.task.findMany({
    where: { workflowId },
    select: {
      status: true,
      durationMs: true,
      tokensInput: true,
      tokensOutput: true,
    },
  })

  if (tasks.length === 0) {
    return null
  }

  // Check if any task is still in progress
  const anyInProgress = tasks.some(
    (task) => task.status === TaskStatus.IN_PROGRESS
  )

  if (anyInProgress) {
    // Workflow stays IN_PROGRESS, but still update metrics
    const metrics = computeWorkflowMetrics(tasks)
    await prisma.workflow.update({
      where: { id: workflowId },
      data: metrics,
    })
    return null
  }

  // All tasks are complete, determine final workflow status
  const anyFailed = tasks.some((task) => task.status === TaskStatus.FAILED)
  const anyPartialSuccess = tasks.some(
    (task) => task.status === TaskStatus.PARTIAL_SUCCESS
  )

  let newStatus: WorkflowStatus
  if (anyFailed || anyPartialSuccess) {
    // If any task failed or had partial success, mark workflow as FAILED
    newStatus = WorkflowStatus.FAILED
  } else {
    // All tasks succeeded
    newStatus = WorkflowStatus.COMPLETED
  }

  // Compute aggregated metrics
  const metrics = computeWorkflowMetrics(tasks)

  const updatedWorkflow = await prisma.workflow.update({
    where: { id: workflowId },
    data: {
      status: newStatus,
      ...metrics,
    },
  })

  return updatedWorkflow
}
