/**
 * get_context MCP Tool
 *
 * Unified query tool to retrieve workflow context for sub-agents.
 * Returns decisions, milestones, blockers, phase summary, and tasks.
 */

import { z } from 'zod'
import { prisma } from '../db.js'
import { NotFoundError } from '../utils/errors.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

// Zod schema for validation
const getContextSchema = z.object({
  workflow_id: z.string().min(1),
  include: z.array(
    z.enum(['decisions', 'milestones', 'blockers', 'tasks'])
  ),
  filter: z
    .object({
      agent: z.string().optional(),
      since: z.string().optional(), // ISO timestamp
    })
    .optional(),
})

// MCP Tool definition
export const getContextTool = {
  name: 'get_context',
  description: 'Retrieve workflow context (decisions, milestones, blockers, tasks)',
  inputSchema: {
    type: 'object' as const,
    properties: {
      workflow_id: {
        type: 'string',
        description: 'The workflow ID to query',
      },
      include: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['decisions', 'milestones', 'blockers', 'tasks'],
        },
        description: 'What context to include in the response',
      },
      filter: {
        type: 'object',
        properties: {
          agent: {
            type: 'string',
            description: 'Filter by agent name',
          },
          since: {
            type: 'string',
            description: 'Filter by timestamp (ISO format)',
          },
        },
        description: 'Optional filters for the query',
      },
    },
    required: ['workflow_id', 'include'],
  },
}

// Handler
export async function handleGetContext(
  args: unknown
): Promise<CallToolResult> {
  // Validate input
  const validated = getContextSchema.parse(args)
  const { workflow_id, include, filter } = validated

  // Verify workflow exists and get tasks
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflow_id },
    include: {
      tasks: true,
    },
  })

  if (!workflow) {
    throw new NotFoundError(`Workflow not found: ${workflow_id}`)
  }

  // Build response object
  const response: Record<string, unknown> = {
    workflow_id: workflow.id,
    workflow_name: workflow.name,
    workflow_status: workflow.status,
  }

  // Get task IDs for the workflow
  const getTaskIds = (): string[] => {
    let tasks = workflow.tasks

    // Filter by agent if specified
    if (filter?.agent) {
      tasks = tasks.filter((t) => t.agentName === filter.agent)
    }

    return tasks.map((t) => t.id)
  }

  const taskIds = getTaskIds()

  // Parse since filter
  const sinceDate = filter?.since ? new Date(filter.since) : undefined

  // Include decisions
  if (include.includes('decisions')) {
    const decisions = await prisma.decision.findMany({
      where: {
        taskId: { in: taskIds },
        ...(sinceDate && { createdAt: { gte: sinceDate } }),
      },
      orderBy: { createdAt: 'desc' },
    })

    response.decisions = decisions.map((d) => ({
      id: d.id,
      category: d.category,
      question: d.question,
      chosen: d.chosen,
      reasoning: d.reasoning,
      created_at: d.createdAt.toISOString(),
    }))
  }

  // Include milestones
  if (include.includes('milestones')) {
    const milestones = await prisma.milestone.findMany({
      where: {
        taskId: { in: taskIds },
        ...(sinceDate && { createdAt: { gte: sinceDate } }),
      },
      orderBy: { createdAt: 'desc' },
    })

    response.milestones = milestones.map((m) => ({
      id: m.id,
      message: m.message,
      progress: m.progress,
      created_at: m.createdAt.toISOString(),
    }))
  }

  // Include blockers (issues with requiresHumanReview=true)
  if (include.includes('blockers')) {
    const blockers = await prisma.issue.findMany({
      where: {
        taskId: { in: taskIds },
        requiresHumanReview: true,
        ...(sinceDate && { createdAt: { gte: sinceDate } }),
      },
      orderBy: { createdAt: 'desc' },
    })

    response.blockers = blockers.map((b) => ({
      id: b.id,
      type: b.type,
      description: b.description,
      resolution: b.resolution,
      created_at: b.createdAt.toISOString(),
    }))
  }

  // Include tasks
  if (include.includes('tasks')) {
    let tasks = workflow.tasks

    // Filter by agent if specified
    if (filter?.agent) {
      tasks = tasks.filter((t) => t.agentName === filter.agent)
    }

    // Filter by since date
    if (sinceDate) {
      tasks = tasks.filter((t) => t.startedAt >= sinceDate)
    }

    response.tasks = tasks.map((t) => ({
      id: t.id,
      name: t.name,
      goal: t.goal,
      status: t.status,
      caller_type: t.callerType,
      agent_name: t.agentName,
      duration_seconds: t.durationMs ? Math.round(t.durationMs / 1000) : null,
      started_at: t.startedAt.toISOString(),
      completed_at: t.completedAt?.toISOString(),
    }))
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
