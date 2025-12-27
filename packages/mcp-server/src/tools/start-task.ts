/**
 * start_task MCP Tool
 *
 * Start a new task and create a Git snapshot.
 * This is a CRITICAL tool that captures the starting state for diff computation.
 */

import { z } from 'zod'
import { prisma } from '../db.js'
import { createGitSnapshot } from '../utils/git-snapshot.js'
import {
  emitTaskCreated,
  emitWorkflowUpdated,
} from '../websocket/index.js'
import { NotFoundError } from '../utils/errors.js'
import {
  WorkflowStatus,
  TaskStatus,
  CallerType,
  callerTypeMap,
} from '../types/enums.js'
import { toJsonArray, toJsonObject } from '../utils/json-fields.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

// Zod schema for validation
const startTaskSchema = z.object({
  workflow_id: z.string().min(1),
  parent_task_id: z.string().optional(),
  caller_type: z.enum(['orchestrator', 'subagent']).optional(),
  agent_name: z.string().optional(),
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
      caller_type: {
        type: 'string',
        enum: ['orchestrator', 'subagent'],
        description: 'Who is calling this task',
      },
      agent_name: {
        type: 'string',
        description: 'Name of the agent (e.g., "feature-implementer")',
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
        description: "Code areas this task will touch (e.g., ['auth', 'api'])",
      },
    },
    required: ['workflow_id', 'name', 'goal'],
  },
}

// Handler
export async function handleStartTask(args: unknown): Promise<CallToolResult> {
  // Validate input
  const validated = startTaskSchema.parse(args)

  const workflowId = validated.workflow_id

  // Verify workflow exists
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  })

  if (!workflow) {
    throw new NotFoundError(`Workflow not found: ${workflowId}`)
  }

  // Ensure workflow is IN_PROGRESS
  if (workflow.status !== WorkflowStatus.IN_PROGRESS) {
    const updatedWorkflow = await prisma.workflow.update({
      where: { id: workflowId },
      data: { status: WorkflowStatus.IN_PROGRESS },
    })
    emitWorkflowUpdated(updatedWorkflow)
  }

  // Verify parent task exists (if specified)
  if (validated.parent_task_id) {
    const parentTask = await prisma.task.findUnique({
      where: { id: validated.parent_task_id },
    })

    if (!parentTask) {
      throw new NotFoundError(`Parent task not found: ${validated.parent_task_id}`)
    }
  }

  // Create Git snapshot (CRITICAL)
  const snapshot = await createGitSnapshot()

  // Convert caller_type to enum
  const callerType = validated.caller_type
    ? callerTypeMap[validated.caller_type]
    : undefined

  // Create task in database
  const task = await prisma.task.create({
    data: {
      workflowId: workflowId,
      parentTaskId: validated.parent_task_id,
      callerType: callerType,
      agentName: validated.agent_name,
      name: validated.name,
      goal: validated.goal,
      areas: toJsonArray(validated.areas),
      snapshotId: snapshot.id,
      snapshotType: snapshot.type,
      snapshotData: toJsonObject(snapshot.data),
      status: TaskStatus.IN_PROGRESS,
    },
  })

  // Emit WebSocket event for real-time UI update
  emitTaskCreated(task, workflowId)

  // Build response
  const response: Record<string, unknown> = {
    task_id: task.id,
    workflow_id: workflowId,
    snapshot_id: snapshot.id,
    snapshot_type: snapshot.type,
    started_at: task.startedAt.toISOString(),
  }

  if (callerType) {
    response.caller_type = validated.caller_type
  }

  if (validated.agent_name) {
    response.agent_name = validated.agent_name
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(response, null, 2),
      },
    ],
  }
}
