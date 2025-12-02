/**
 * start_task MCP Tool
 *
 * Start a new task and create a Git snapshot.
 * This is a CRITICAL tool that captures the starting state for diff computation.
 */

import { z } from 'zod'
import { prisma } from '../db.js'
import { createGitSnapshot } from '../utils/git-snapshot.js'
import { emitTaskCreated, emitWorkflowUpdated } from '../websocket/index.js'
import { NotFoundError } from '../utils/errors.js'
import { WorkflowStatus, TaskStatus } from '../types/enums.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

// Zod schema for validation
const startTaskSchema = z.object({
  workflow_id: z.string().min(1),
  parent_task_id: z.string().optional(),
  name: z.string().min(1).max(200),
  goal: z.string().min(1),
  areas: z.array(z.string()).optional(),
})

// MCP Tool definition
export const startTaskTool = {
  name: 'start_task',
  description: 'Start a new task and create a Git snapshot',
  inputSchema: {
    type: 'object' as const,
    properties: {
      workflow_id: {
        type: 'string',
        description: 'Parent workflow ID',
      },
      parent_task_id: {
        type: 'string',
        description: 'Parent task ID (null if top-level task)',
      },
      name: {
        type: 'string',
        description: "Task name (e.g., 'Implement Stripe integration')",
      },
      goal: {
        type: 'string',
        description: 'Precise goal of this task',
      },
      areas: {
        type: 'array',
        items: { type: 'string' },
        description:
          "Code areas this task will touch (e.g., ['auth', 'api'])",
      },
    },
    required: ['workflow_id', 'name', 'goal'],
  },
}

// Handler
export async function handleStartTask(args: unknown): Promise<CallToolResult> {
  // Validate input
  const validated = startTaskSchema.parse(args)

  // Verify workflow exists
  const workflow = await prisma.workflow.findUnique({
    where: { id: validated.workflow_id },
  })

  if (!workflow) {
    throw new NotFoundError(`Workflow not found: ${validated.workflow_id}`)
  }

  // Verify parent task exists (if specified)
  if (validated.parent_task_id) {
    const parentTask = await prisma.task.findUnique({
      where: { id: validated.parent_task_id },
    })

    if (!parentTask) {
      throw new NotFoundError(
        `Parent task not found: ${validated.parent_task_id}`
      )
    }
  }

  // Create Git snapshot (CRITICAL)
  const snapshot = await createGitSnapshot()

  // Create task in database
  const task = await prisma.task.create({
    data: {
      workflowId: validated.workflow_id,
      parentTaskId: validated.parent_task_id,
      name: validated.name,
      goal: validated.goal,
      areas: JSON.stringify(validated.areas ?? []),
      snapshotId: snapshot.id,
      snapshotType: snapshot.type,
      snapshotData: JSON.stringify(snapshot.data),
      status: TaskStatus.IN_PROGRESS,
    },
  })

  // Emit WebSocket event for real-time UI update
  emitTaskCreated(task, validated.workflow_id)

  // Ensure workflow is IN_PROGRESS when a new task is started
  // (fixes bug where workflow was COMPLETED but new task is started)
  if (workflow.status !== WorkflowStatus.IN_PROGRESS) {
    const updatedWorkflow = await prisma.workflow.update({
      where: { id: validated.workflow_id },
      data: { status: WorkflowStatus.IN_PROGRESS },
    })
    emitWorkflowUpdated(updatedWorkflow)
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            task_id: task.id,
            snapshot_id: snapshot.id,
            snapshot_type: snapshot.type,
            started_at: task.startedAt.toISOString(),
          },
          null,
          2
        ),
      },
    ],
  }
}
