/**
 * start_task MCP Tool
 *
 * Start a new task within a phase and create a Git snapshot.
 * This is a CRITICAL tool that captures the starting state for diff computation.
 *
 * Tasks MUST be associated with a phase. The orchestrator creates phases
 * via start_phase before launching subagents.
 */

import { z } from 'zod'
import { prisma } from '../db.js'
import { createGitSnapshot } from '../utils/git-snapshot.js'
import {
  emitTaskCreated,
  emitWorkflowUpdated,
} from '../websocket/index.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'
import {
  WorkflowStatus,
  TaskStatus,
  CallerType,
  callerTypeMap,
  PhaseStatus,
} from '../types/enums.js'
import { toJsonArray, toJsonObject } from '../utils/json-fields.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

// Zod schema for validation
const startTaskSchema = z.object({
  workflow_id: z.string().min(1),
  phase_id: z.string().min(1),
  parent_task_id: z.string().optional(),
  caller_type: z.enum(['orchestrator', 'subagent']),
  agent_name: z.string().optional(),
  name: z.string().min(1).max(200),
  goal: z.string().min(1),
  areas: z.array(z.string()).optional(),
})

// MCP Tool definition
export const startTaskTool = {
  name: 'start_task',
  description: 'Start a new task within a phase and create a Git snapshot. Requires phase_id from orchestrator.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      workflow_id: {
        type: 'string',
        description: 'Parent workflow ID',
      },
      phase_id: {
        type: 'string',
        description: 'Phase ID (from start_phase). Tasks must belong to a phase.',
      },
      parent_task_id: {
        type: 'string',
        description: 'Parent task ID for nested tasks (optional)',
      },
      caller_type: {
        type: 'string',
        enum: ['orchestrator', 'subagent'],
        description: 'Who is calling this task (orchestrator or subagent)',
      },
      agent_name: {
        type: 'string',
        description: 'Name of the subagent (e.g., "feature-implementer"). Required when caller_type is subagent.',
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
    required: ['workflow_id', 'phase_id', 'caller_type', 'name', 'goal'],
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

  // Verify phase exists and belongs to workflow
  const phase = await prisma.phase.findUnique({
    where: { id: validated.phase_id },
  })

  if (!phase) {
    throw new NotFoundError(`Phase not found: ${validated.phase_id}`)
  }

  if (phase.workflowId !== workflowId) {
    throw new ValidationError(
      `Phase ${validated.phase_id} does not belong to workflow ${workflowId}`
    )
  }

  if (phase.status !== PhaseStatus.IN_PROGRESS) {
    throw new ValidationError(
      `Phase is ${phase.status}, cannot add tasks`
    )
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

  // Validate subagent has agent_name
  if (validated.caller_type === 'subagent' && !validated.agent_name) {
    throw new ValidationError(
      'agent_name is required when caller_type is subagent'
    )
  }

  // Create Git snapshot (CRITICAL)
  const snapshot = await createGitSnapshot()

  // Convert caller_type to enum
  const callerType = callerTypeMap[validated.caller_type]

  // Create task in database
  const task = await prisma.task.create({
    data: {
      workflowId: workflowId,
      phaseId: validated.phase_id,
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
    phase_id: validated.phase_id,
    phase_number: phase.number,
    phase_name: phase.name,
    caller_type: validated.caller_type,
    snapshot_id: snapshot.id,
    snapshot_type: snapshot.type,
    started_at: task.startedAt.toISOString(),
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
