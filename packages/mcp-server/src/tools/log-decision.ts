/**
 * log_decision MCP Tool
 *
 * Log an important architectural decision.
 */

import { z } from 'zod'
import { prisma } from '../db.js'
import { emitDecisionCreated } from '../websocket/index.js'
import { NotFoundError } from '../utils/errors.js'
import { decisionCategoryMap } from '../types/enums.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

// Zod schema for validation
const logDecisionSchema = z.object({
  task_id: z.string().min(1),
  category: z.enum([
    'architecture',
    'library_choice',
    'trade_off',
    'workaround',
    'other',
  ]),
  question: z.string().min(1),
  options_considered: z.array(z.string()).optional(),
  chosen: z.string().min(1),
  reasoning: z.string().min(1),
  trade_offs: z.string().optional(),
})

// MCP Tool definition
export const logDecisionTool = {
  name: 'log_decision',
  description: 'Log an important architectural decision',
  inputSchema: {
    type: 'object' as const,
    properties: {
      task_id: {
        type: 'string',
        description: 'Task ID this decision belongs to',
      },
      category: {
        type: 'string',
        enum: [
          'architecture',
          'library_choice',
          'trade_off',
          'workaround',
          'other',
        ],
        description: 'Category of the decision',
      },
      question: {
        type: 'string',
        description:
          "The decision question (e.g., 'Which auth library to use?')",
      },
      options_considered: {
        type: 'array',
        items: { type: 'string' },
        description:
          "Options evaluated (e.g., ['NextAuth', 'Clerk', 'Custom'])",
      },
      chosen: {
        type: 'string',
        description: 'Chosen option',
      },
      reasoning: {
        type: 'string',
        description: 'Why this choice (1-2 sentences)',
      },
      trade_offs: {
        type: 'string',
        description: 'Accepted compromises (optional)',
      },
    },
    required: ['task_id', 'category', 'question', 'chosen', 'reasoning'],
  },
}

// Handler
export async function handleLogDecision(
  args: unknown
): Promise<CallToolResult> {
  // Validate input
  const validated = logDecisionSchema.parse(args)

  // Verify task exists
  const task = await prisma.task.findUnique({
    where: { id: validated.task_id },
  })

  if (!task) {
    throw new NotFoundError(`Task not found: ${validated.task_id}`)
  }

  // Map category string to Prisma enum
  const category = decisionCategoryMap[validated.category]
  if (!category) {
    throw new Error(`Invalid category: ${validated.category}`)
  }

  // Create decision in database
  const decision = await prisma.decision.create({
    data: {
      taskId: validated.task_id,
      category,
      question: validated.question,
      optionsConsidered: validated.options_considered ?? [],
      chosen: validated.chosen,
      reasoning: validated.reasoning,
      tradeOffs: validated.trade_offs,
    },
  })

  // Emit WebSocket event for real-time UI update
  emitDecisionCreated(decision, validated.task_id, task.workflowId)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            decision_id: decision.id,
            created_at: decision.createdAt.toISOString(),
          },
          null,
          2
        ),
      },
    ],
  }
}
