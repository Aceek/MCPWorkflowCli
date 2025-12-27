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
  emitPhaseCreated,
  emitMissionUpdated,
} from '../websocket/index.js'
import { NotFoundError } from '../utils/errors.js'
import {
  WorkflowStatus,
  TaskStatus,
  MissionStatus,
  PhaseStatus,
  CallerType,
  callerTypeMap,
} from '../types/enums.js'
import { toJsonArray, toJsonObject } from '../utils/json-fields.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

// Zod schema for validation
const startTaskSchema = z.object({
  // Legacy workflow support
  workflow_id: z.string().min(1).optional(),
  parent_task_id: z.string().optional(),
  // Mission system fields
  mission_id: z.string().min(1).optional(),
  phase: z.number().int().min(1).optional(),
  phase_name: z.string().optional(),
  caller_type: z.enum(['orchestrator', 'subagent']).optional(),
  agent_name: z.string().optional(),
  // Common fields
  name: z.string().min(1).max(200),
  goal: z.string().min(1),
  areas: z.array(z.string()).optional(),
})

// MCP Tool definition
export const startTaskTool = {
  name: 'start_task',
  description: 'Start a new task and create a Git snapshot. Supports both legacy workflows and mission-based orchestration.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      workflow_id: {
        type: 'string',
        description: 'Parent workflow ID (legacy mode)',
      },
      parent_task_id: {
        type: 'string',
        description: 'Parent task ID (null if top-level task)',
      },
      mission_id: {
        type: 'string',
        description: 'Mission ID (for mission-based orchestration)',
      },
      phase: {
        type: 'number',
        description: 'Phase number (1, 2, 3...). Phase is auto-created if it does not exist.',
      },
      phase_name: {
        type: 'string',
        description: 'Name for the phase (used when auto-creating)',
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
    required: ['name', 'goal'],
  },
}

// Handler
export async function handleStartTask(args: unknown): Promise<CallToolResult> {
  // Validate input
  const validated = startTaskSchema.parse(args)

  // Determine mode: mission-based or legacy workflow
  const isMissionMode = !!validated.mission_id
  let workflowId: string | undefined = validated.workflow_id
  let phaseId: string | undefined
  let phaseCreated = false

  if (isMissionMode && validated.mission_id) {
    // Mission-based mode
    const missionId = validated.mission_id // TypeScript narrowing

    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
    })

    if (!mission) {
      throw new NotFoundError(`Mission not found: ${missionId}`)
    }

    // Phase auto-creation logic
    if (validated.phase !== undefined) {
      // Check if phase exists
      let phase = await prisma.phase.findUnique({
        where: {
          missionId_number: {
            missionId: missionId,
            number: validated.phase,
          },
        },
      })

      if (!phase) {
        // Auto-create phase
        phase = await prisma.phase.create({
          data: {
            missionId: missionId,
            number: validated.phase,
            name: validated.phase_name || `Phase ${validated.phase}`,
            status: PhaseStatus.IN_PROGRESS,
            startedAt: new Date(),
          },
        })
        phaseCreated = true
        emitPhaseCreated(phase, missionId)
      } else if (phase.status === PhaseStatus.PENDING) {
        // Start the phase if it was pending
        phase = await prisma.phase.update({
          where: { id: phase.id },
          data: {
            status: PhaseStatus.IN_PROGRESS,
            startedAt: new Date(),
          },
        })
      }

      phaseId = phase.id
    }

    // Update mission status to IN_PROGRESS if needed
    if (mission.status === MissionStatus.PENDING) {
      const updatedMission = await prisma.mission.update({
        where: { id: missionId },
        data: { status: MissionStatus.IN_PROGRESS },
      })
      emitMissionUpdated(updatedMission)
    }
  } else if (workflowId) {
    // Legacy workflow mode
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
  } else {
    throw new NotFoundError('Either workflow_id or mission_id is required')
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
      workflowId: workflowId || 'mission-task', // Required field, use placeholder for mission mode
      parentTaskId: validated.parent_task_id,
      phaseId: phaseId,
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
  emitTaskCreated(task, workflowId || validated.mission_id!)

  // Build response
  const response: Record<string, unknown> = {
    task_id: task.id,
    snapshot_id: snapshot.id,
    snapshot_type: snapshot.type,
    started_at: task.startedAt.toISOString(),
  }

  if (phaseId) {
    response.phase_id = phaseId
    response.phase_created = phaseCreated
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
