/**
 * log_milestone MCP Tool
 *
 * Log a milestone for real-time UI updates.
 * This is a lightweight, fire-and-forget operation.
 */

import { z } from 'zod'
import { prisma } from '../db.js'
import { Prisma } from '@prisma/client'
import { NotFoundError } from '../utils/errors.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

// Zod schema for validation
const logMilestoneSchema = z.object({
  task_id: z.string().min(1),
  message: z.string().min(1).max(500),
  progress: z.number().min(0).max(100).optional(),
  metadata: z.record(z.unknown()).optional(),
})

// MCP Tool definition
export const logMilestoneTool = {
  name: 'log_milestone',
  description: 'Log a milestone for real-time UI updates',
  inputSchema: {
    type: 'object' as const,
    properties: {
      task_id: {
        type: 'string',
        description: 'Task ID this milestone belongs to',
      },
      message: {
        type: 'string',
        description: "Short message (e.g., 'Running tests...')",
      },
      progress: {
        type: 'number',
        description: 'Estimated progress (0-100)',
        minimum: 0,
        maximum: 100,
      },
      metadata: {
        type: 'object',
        description: 'Optional additional data',
      },
    },
    required: ['task_id', 'message'],
  },
}

// Handler
export async function handleLogMilestone(
  args: unknown
): Promise<CallToolResult> {
  // Validate input
  const validated = logMilestoneSchema.parse(args)

  // Verify task exists
  const task = await prisma.task.findUnique({
    where: { id: validated.task_id },
  })

  if (!task) {
    throw new NotFoundError(`Task not found: ${validated.task_id}`)
  }

  // Create milestone in database
  const milestone = await prisma.milestone.create({
    data: {
      taskId: validated.task_id,
      message: validated.message,
      progress: validated.progress,
      metadata: validated.metadata
        ? (validated.metadata as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    },
  })

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            milestone_id: milestone.id,
            created_at: milestone.createdAt.toISOString(),
          },
          null,
          2
        ),
      },
    ],
  }
}
