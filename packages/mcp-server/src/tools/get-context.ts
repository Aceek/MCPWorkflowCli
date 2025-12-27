/**
 * get_context MCP Tool
 *
 * Unified query tool to retrieve mission context for sub-agents.
 * Returns decisions, milestones, blockers, phase summary, and tasks.
 */

import { z } from 'zod'
import { prisma } from '../db.js'
import { NotFoundError } from '../utils/errors.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

// Zod schema for validation
const getContextSchema = z.object({
  mission_id: z.string().min(1),
  include: z.array(
    z.enum(['decisions', 'milestones', 'blockers', 'phase_summary', 'tasks'])
  ),
  filter: z
    .object({
      phase: z.number().int().optional(),
      agent: z.string().optional(),
      since: z.string().optional(), // ISO timestamp
    })
    .optional(),
})

// MCP Tool definition
export const getContextTool = {
  name: 'get_context',
  description: 'Retrieve mission context (decisions, milestones, blockers, phases, tasks)',
  inputSchema: {
    type: 'object' as const,
    properties: {
      mission_id: {
        type: 'string',
        description: 'The mission ID to query',
      },
      include: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['decisions', 'milestones', 'blockers', 'phase_summary', 'tasks'],
        },
        description: 'What context to include in the response',
      },
      filter: {
        type: 'object',
        properties: {
          phase: {
            type: 'number',
            description: 'Filter by phase number',
          },
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
    required: ['mission_id', 'include'],
  },
}

// Handler
export async function handleGetContext(
  args: unknown
): Promise<CallToolResult> {
  // Validate input
  const validated = getContextSchema.parse(args)
  const { mission_id, include, filter } = validated

  // Verify mission exists and get phases
  const mission = await prisma.mission.findUnique({
    where: { id: mission_id },
    include: {
      phases: {
        include: {
          tasks: true,
        },
        orderBy: { number: 'asc' },
      },
    },
  })

  if (!mission) {
    throw new NotFoundError(`Mission not found: ${mission_id}`)
  }

  // Build response object
  const response: Record<string, unknown> = {
    mission_id: mission.id,
    mission_name: mission.name,
    mission_status: mission.status,
    current_phase: mission.currentPhase,
    total_phases: mission.totalPhases,
  }

  // Get task IDs for the mission, optionally filtered by phase
  const getTaskIds = async (): Promise<string[]> => {
    let phases = mission.phases

    // Filter by phase number if specified
    if (filter?.phase !== undefined) {
      phases = phases.filter((p) => p.number === filter.phase)
    }

    let tasks = phases.flatMap((p) => p.tasks)

    // Filter by agent if specified
    if (filter?.agent) {
      tasks = tasks.filter((t) => t.agentName === filter.agent)
    }

    return tasks.map((t) => t.id)
  }

  const taskIds = await getTaskIds()

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

  // Include phase summary
  if (include.includes('phase_summary')) {
    let phases = mission.phases

    // Filter by phase number if specified
    if (filter?.phase !== undefined) {
      phases = phases.filter((p) => p.number === filter.phase)
    }

    response.phase_summary = phases.map((phase) => {
      const phaseTasks = phase.tasks
      const totalDurationMs = phaseTasks.reduce(
        (sum, t) => sum + (t.durationMs || 0),
        0
      )

      return {
        phase_number: phase.number,
        name: phase.name,
        status: phase.status,
        is_parallel: phase.isParallel,
        tasks_count: phaseTasks.length,
        duration_seconds: Math.round(totalDurationMs / 1000),
        started_at: phase.startedAt?.toISOString(),
        completed_at: phase.completedAt?.toISOString(),
      }
    })
  }

  // Include tasks
  if (include.includes('tasks')) {
    let phases = mission.phases

    // Filter by phase number if specified
    if (filter?.phase !== undefined) {
      phases = phases.filter((p) => p.number === filter.phase)
    }

    let tasks = phases.flatMap((p) =>
      p.tasks.map((t) => ({ ...t, phaseNumber: p.number }))
    )

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
      phase: t.phaseNumber,
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
