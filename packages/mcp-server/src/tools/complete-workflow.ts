/**
 * complete_workflow MCP Tool
 *
 * Finalize a workflow and aggregate metrics.
 */

import { z } from 'zod'
import { prisma } from '../db.js'
import { emitWorkflowUpdated } from '../websocket/index.js'
import { WorkflowStatus, workflowStatusMap } from '../types/enums.js'
import { NotFoundError } from '../utils/errors.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

// Zod schema for validation
const completeWorkflowSchema = z.object({
  workflow_id: z.string().min(1),
  status: z.enum(['completed', 'failed', 'partial']),
  summary: z.string().min(1),
  achievements: z.array(z.string()).optional(),
  limitations: z.array(z.string()).optional(),
})

// MCP Tool definition
export const completeWorkflowTool = {
  name: 'complete_workflow',
  description: 'Finalize a workflow and aggregate metrics',
  inputSchema: {
    type: 'object' as const,
    properties: {
      workflow_id: {
        type: 'string',
        description: 'The workflow ID to complete',
      },
      status: {
        type: 'string',
        enum: ['completed', 'failed', 'partial'],
        description: 'Final status of the workflow',
      },
      summary: {
        type: 'string',
        description: 'Summary of what was accomplished',
      },
      achievements: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of achievements during the workflow',
      },
      limitations: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of limitations or issues encountered',
      },
    },
    required: ['workflow_id', 'status', 'summary'],
  },
}

// Handler
export async function handleCompleteWorkflow(
  args: unknown
): Promise<CallToolResult> {
  // Validate input
  const validated = completeWorkflowSchema.parse(args)

  // Verify workflow exists with its tasks
  const existingWorkflow = await prisma.workflow.findUnique({
    where: { id: validated.workflow_id },
    include: {
      tasks: true,
    },
  })

  if (!existingWorkflow) {
    throw new NotFoundError(`Workflow not found: ${validated.workflow_id}`)
  }

  // Calculate workflow metrics
  const totalTasks = existingWorkflow.tasks.length

  const totalDurationMs = existingWorkflow.tasks.reduce(
    (sum, task) => sum + (task.durationMs || 0),
    0
  )

  // Aggregate files changed across all tasks
  const filesChanged = new Set<string>()
  existingWorkflow.tasks.forEach((task) => {
    const added = JSON.parse(task.filesAdded || '[]') as string[]
    const modified = JSON.parse(task.filesModified || '[]') as string[]
    const deleted = JSON.parse(task.filesDeleted || '[]') as string[]
    added.forEach((f) => filesChanged.add(f))
    modified.forEach((f) => filesChanged.add(f))
    deleted.forEach((f) => filesChanged.add(f))
  })

  // Aggregate token usage
  const totalTokens = existingWorkflow.tasks.reduce((sum, task) => {
    return sum + (task.tokensInput || 0) + (task.tokensOutput || 0)
  }, 0)

  // Map status to WorkflowStatus
  const newStatus = workflowStatusMap[validated.status]

  // Update workflow status
  const workflow = await prisma.workflow.update({
    where: { id: validated.workflow_id },
    data: {
      status: newStatus,
      totalDurationMs,
      totalTokens,
    },
  })

  // Emit WebSocket event
  emitWorkflowUpdated(workflow)

  // Calculate total duration in a readable format
  const durationSeconds = Math.round(totalDurationMs / 1000)
  const durationMinutes = Math.round(durationSeconds / 60)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            workflow_id: workflow.id,
            status: validated.status,
            summary: validated.summary,
            achievements: validated.achievements || [],
            limitations: validated.limitations || [],
            metrics: {
              total_tasks: totalTasks,
              total_duration_seconds: durationSeconds,
              total_duration_minutes: durationMinutes,
              total_tokens: totalTokens,
              files_changed: filesChanged.size,
            },
            completed_at: new Date().toISOString(),
          },
          null,
          2
        ),
      },
    ],
  }
}
