/**
 * start_phase MCP Tool
 *
 * Create a new phase within a workflow.
 * Called by orchestrator before launching subagents.
 */

import { z } from 'zod'
import { prisma } from '../db.js'
import { emitPhaseCreated, emitWorkflowUpdated } from '../websocket/index.js'
import { NotFoundError } from '../utils/errors.js'
import { PhaseStatus, WorkflowStatus } from '../types/enums.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

// Zod schema for validation
const startPhaseSchema = z.object({
  workflow_id: z.string().min(1),
  number: z.number().int().positive(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  is_parallel: z.boolean().optional().default(false),
})

// MCP Tool definition
export const startPhaseTool = {
  name: 'start_phase',
  description: 'Create a new phase within a workflow. Called by orchestrator before launching subagents.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      workflow_id: {
        type: 'string',
        description: 'Parent workflow ID',
      },
      number: {
        type: 'number',
        description: 'Phase number (sequential: 1, 2, 3...)',
      },
      name: {
        type: 'string',
        description: "Phase name (e.g., 'Design Specification', 'Implementation')",
      },
      description: {
        type: 'string',
        description: 'Optional phase description',
      },
      is_parallel: {
        type: 'boolean',
        description: 'Whether tasks in this phase run in parallel (default: false)',
      },
    },
    required: ['workflow_id', 'number', 'name'],
  },
}

// Handler
export async function handleStartPhase(args: unknown): Promise<CallToolResult> {
  // Validate input
  const validated = startPhaseSchema.parse(args)

  // Verify workflow exists
  const workflow = await prisma.workflow.findUnique({
    where: { id: validated.workflow_id },
  })

  if (!workflow) {
    throw new NotFoundError(`Workflow not found: ${validated.workflow_id}`)
  }

  // Ensure workflow is IN_PROGRESS
  if (workflow.status !== WorkflowStatus.IN_PROGRESS) {
    const updatedWorkflow = await prisma.workflow.update({
      where: { id: validated.workflow_id },
      data: { status: WorkflowStatus.IN_PROGRESS },
    })
    emitWorkflowUpdated(updatedWorkflow)
  }

  // Check if phase already exists
  const existingPhase = await prisma.phase.findUnique({
    where: {
      workflowId_number: {
        workflowId: validated.workflow_id,
        number: validated.number,
      },
    },
  })

  if (existingPhase) {
    // Return existing phase (idempotent)
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            phase_id: existingPhase.id,
            workflow_id: validated.workflow_id,
            number: existingPhase.number,
            name: existingPhase.name,
            is_parallel: existingPhase.isParallel,
            status: existingPhase.status,
            already_exists: true,
          }, null, 2),
        },
      ],
    }
  }

  // Create phase in database
  const phase = await prisma.phase.create({
    data: {
      workflowId: validated.workflow_id,
      number: validated.number,
      name: validated.name,
      description: validated.description,
      isParallel: validated.is_parallel,
      status: PhaseStatus.IN_PROGRESS,
      startedAt: new Date(),
    },
  })

  // Update workflow current phase
  const updatedWorkflow = await prisma.workflow.update({
    where: { id: validated.workflow_id },
    data: { currentPhase: validated.number },
  })

  // Emit WebSocket events
  emitPhaseCreated(phase, validated.workflow_id)
  emitWorkflowUpdated(updatedWorkflow)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          phase_id: phase.id,
          workflow_id: validated.workflow_id,
          number: phase.number,
          name: phase.name,
          is_parallel: phase.isParallel,
          status: phase.status,
          started_at: phase.startedAt?.toISOString(),
        }, null, 2),
      },
    ],
  }
}
