/**
 * Workflow Metrics Utilities
 *
 * Computes aggregated metrics for workflows.
 * Extracted from complete-task.ts to improve maintainability.
 *
 * IMPORTANT: This module does NOT handle workflow status transitions.
 * Only the orchestrator can complete a workflow via complete_workflow().
 */

import { prisma } from '../db.js'

/**
 * Task data required for metrics computation
 */
interface TaskMetricsData {
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
 * Update workflow metrics (totalDurationMs, totalTokens) after task completion.
 *
 * IMPORTANT: This function NEVER changes workflow status.
 * Only the orchestrator can complete a workflow via complete_workflow().
 *
 * This prevents the workflow from flipping between COMPLETED and IN_PROGRESS
 * when phases are executed sequentially (e.g., Phase 1 tasks complete, but
 * Phase 2 hasn't started yet).
 */
export async function updateWorkflowMetrics(workflowId: string): Promise<void> {
  const tasks = await prisma.task.findMany({
    where: { workflowId },
    select: {
      durationMs: true,
      tokensInput: true,
      tokensOutput: true,
    },
  })

  if (tasks.length === 0) {
    return
  }

  // Compute and update aggregated metrics only
  const metrics = computeWorkflowMetrics(tasks)
  await prisma.workflow.update({
    where: { id: workflowId },
    data: metrics,
  })
}
