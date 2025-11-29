/**
 * start_workflow MCP Tool
 *
 * Initialize a new workflow tracking session.
 */

import { z } from 'zod'
import { prisma } from '../db.js'
import { Prisma, WorkflowStatus } from '@prisma/client'
import { emitWorkflowCreated } from '../websocket/index.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

// Zod schema for validation
const startWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  plan: z
    .array(
      z.object({
        step: z.string(),
        goal: z.string(),
      })
    )
    .optional(),
})

// MCP Tool definition
export const startWorkflowTool = {
  name: 'start_workflow',
  description: 'Initialize a new workflow tracking session',
  inputSchema: {
    type: 'object' as const,
    properties: {
      name: {
        type: 'string',
        description: "Short workflow name (e.g., 'Auth system refactor')",
      },
      description: {
        type: 'string',
        description: 'Detailed description of the workflow goal',
      },
      plan: {
        type: 'array',
        description: 'Optional implementation plan as steps',
        items: {
          type: 'object',
          properties: {
            step: { type: 'string' },
            goal: { type: 'string' },
          },
          required: ['step', 'goal'],
        },
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

  // Create workflow in database
  const workflow = await prisma.workflow.create({
    data: {
      name: validated.name,
      description: validated.description,
      plan: validated.plan ?? Prisma.JsonNull,
      status: WorkflowStatus.IN_PROGRESS,
    },
  })

  // Emit WebSocket event for real-time UI update
  emitWorkflowCreated(workflow)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            workflow_id: workflow.id,
            created_at: workflow.createdAt.toISOString(),
          },
          null,
          2
        ),
      },
    ],
  }
}
