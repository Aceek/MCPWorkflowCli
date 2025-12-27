/**
 * start_workflow MCP Tool
 *
 * Initialize a new workflow tracking session with optional multi-phase orchestration.
 */

import { z } from 'zod'
import { prisma } from '../db.js'
import { emitWorkflowCreated } from '../websocket/index.js'
import { WorkflowStatus, WorkflowProfile, workflowProfileMap } from '../types/enums.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

// Zod schema for validation
const startWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  // Legacy field
  plan: z.string().optional(),
  // Extended workflow fields
  objective: z.string().optional(),
  profile: z.enum(['simple', 'standard', 'complex']).optional().default('standard'),
  total_phases: z.number().int().min(1).max(20).optional(),
  scope: z.string().optional(),
  constraints: z.string().optional(),
})

// MCP Tool definition
export const startWorkflowTool = {
  name: 'start_workflow',
  description: 'Initialize a new workflow tracking session for multi-phase orchestration',
  inputSchema: {
    type: 'object' as const,
    properties: {
      name: {
        type: 'string',
        description: "Short workflow name (e.g., 'Implement auth system')",
      },
      description: {
        type: 'string',
        description: 'Detailed description of the workflow',
      },
      plan: {
        type: 'string',
        description: 'JSON string with workflow plan (legacy)',
      },
      objective: {
        type: 'string',
        description: 'Measurable goal for the workflow',
      },
      profile: {
        type: 'string',
        enum: ['simple', 'standard', 'complex'],
        description: 'Workflow complexity profile (simple=2 phases, standard=3, complex=4+)',
      },
      total_phases: {
        type: 'number',
        description: 'Expected number of phases (for progress tracking)',
      },
      scope: {
        type: 'string',
        description: "What's included/excluded from this workflow",
      },
      constraints: {
        type: 'string',
        description: 'Technical constraints or limitations',
      },
    },
    required: ['name'],
  },
}

// Handler
export async function handleStartWorkflow(
  args: unknown
): Promise<CallToolResult> {
  // Validate input
  const validated = startWorkflowSchema.parse(args)

  // Convert profile to enum value
  const profile = workflowProfileMap[validated.profile] || WorkflowProfile.STANDARD

  // Determine default phases based on profile if not specified
  let totalPhases = validated.total_phases
  if (!totalPhases && validated.objective) {
    // Set default phases based on profile when objective is provided
    switch (profile) {
      case WorkflowProfile.SIMPLE:
        totalPhases = 2
        break
      case WorkflowProfile.STANDARD:
        totalPhases = 3
        break
      case WorkflowProfile.COMPLEX:
        totalPhases = 4
        break
      default:
        totalPhases = 3
    }
  }

  // Create workflow in database
  const workflow = await prisma.workflow.create({
    data: {
      name: validated.name,
      description: validated.description,
      plan: validated.plan,
      objective: validated.objective,
      scope: validated.scope,
      constraints: validated.constraints,
      profile: profile,
      totalPhases: totalPhases ?? 1,
      status: WorkflowStatus.IN_PROGRESS,
    },
  })

  // Emit WebSocket event for real-time UI update
  emitWorkflowCreated(workflow)

  // Build response
  const response: Record<string, unknown> = {
    workflow_id: workflow.id,
    created_at: workflow.createdAt.toISOString(),
  }

  // Include extended fields if provided
  if (validated.objective) {
    response.objective = validated.objective
    response.profile = profile
    response.total_phases = totalPhases
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
