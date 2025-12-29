/**
 * get_context MCP Tool
 *
 * Unified query tool to retrieve workflow context for orchestrators and sub-agents.
 * This is the PRIMARY tool for accessing workflow "memory" and state.
 *
 * Supports:
 * - decisions: Architectural decisions made during tasks
 * - milestones: Progress updates from agents
 * - blockers: Issues requiring human review
 * - tasks: Task list with status and metadata
 * - phase_summary: Aggregated phase statistics
 *
 * Filters:
 * - agent: Filter by agent name
 * - phase: Filter by phase number
 * - since: Filter by timestamp (ISO format)
 */

import { z } from 'zod'
import { prisma } from '../db.js'
import { NotFoundError } from '../utils/errors.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

// Zod schema for validation
const getContextSchema = z.object({
  workflow_id: z.string().min(1),
  include: z.array(
    z.enum(['decisions', 'milestones', 'blockers', 'tasks', 'phase_summary'])
  ),
  filter: z
    .object({
      agent: z.string().optional(),
      phase: z.number().int().positive().optional(),
      since: z.string().optional(), // ISO timestamp
    })
    .optional(),
})

// MCP Tool definition
export const getContextTool = {
  name: 'get_context',
  description:
    'Retrieve workflow context (decisions, milestones, blockers, tasks, phase_summary). Primary tool for accessing workflow memory and state.',
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
          enum: ['decisions', 'milestones', 'blockers', 'tasks', 'phase_summary'],
        },
        description:
          'What context to include: decisions (architectural choices), milestones (progress), blockers (issues needing review), tasks (task list), phase_summary (aggregated phase stats)',
      },
      filter: {
        type: 'object',
        properties: {
          agent: {
            type: 'string',
            description: 'Filter by agent name (e.g., "feature-implementer")',
          },
          phase: {
            type: 'number',
            description: 'Filter by phase number (1, 2, 3...)',
          },
          since: {
            type: 'string',
            description: 'Filter by timestamp (ISO format, e.g., "2024-01-15T10:00:00Z")',
          },
        },
        description: 'Optional filters to narrow down results',
      },
    },
    required: ['workflow_id', 'include'],
  },
}

// Helper: Get phase IDs for a given phase number filter
async function getPhaseIdsByNumber(
  workflowId: string,
  phaseNumber: number
): Promise<string[]> {
  const phase = await prisma.phase.findUnique({
    where: {
      workflowId_number: {
        workflowId,
        number: phaseNumber,
      },
    },
    select: { id: true },
  })
  return phase ? [phase.id] : []
}

// Handler
export async function handleGetContext(
  args: unknown
): Promise<CallToolResult> {
  // Validate input
  const validated = getContextSchema.parse(args)
  const { workflow_id, include, filter } = validated

  // Verify workflow exists and load with phases and tasks
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflow_id },
    include: {
      phases: {
        include: {
          tasks: true,
        },
        orderBy: { number: 'asc' },
      },
      tasks: true,
    },
  })

  if (!workflow) {
    throw new NotFoundError(`Workflow not found: ${workflow_id}`)
  }

  // Parse filters
  const sinceDate = filter?.since ? new Date(filter.since) : undefined
  const phaseFilter = filter?.phase
  const agentFilter = filter?.agent

  // Get phase IDs if filtering by phase number
  let phaseIds: string[] | undefined
  if (phaseFilter) {
    phaseIds = await getPhaseIdsByNumber(workflow_id, phaseFilter)
    if (phaseIds.length === 0) {
      // Phase doesn't exist, return empty results
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                workflow_id: workflow.id,
                workflow_name: workflow.name,
                workflow_status: workflow.status,
                warning: `Phase ${phaseFilter} not found in workflow`,
              },
              null,
              2
            ),
          },
        ],
      }
    }
  }

  // Get filtered tasks
  const getFilteredTasks = () => {
    let tasks = workflow.tasks

    // Filter by phase
    if (phaseIds && phaseIds.length > 0) {
      tasks = tasks.filter((t) => t.phaseId && phaseIds.includes(t.phaseId))
    }

    // Filter by agent
    if (agentFilter) {
      tasks = tasks.filter((t) => t.agentName === agentFilter)
    }

    // Filter by since date
    if (sinceDate) {
      tasks = tasks.filter((t) => t.startedAt >= sinceDate)
    }

    return tasks
  }

  const filteredTasks = getFilteredTasks()
  const taskIds = filteredTasks.map((t) => t.id)

  // Build response object
  const response: Record<string, unknown> = {
    workflow_id: workflow.id,
    workflow_name: workflow.name,
    workflow_status: workflow.status,
    current_phase: workflow.currentPhase,
    total_phases: workflow.totalPhases,
  }

  // Include phase_summary
  if (include.includes('phase_summary')) {
    const phaseSummary = workflow.phases.map((phase) => {
      const phaseTasks = phase.tasks
      const completed = phaseTasks.filter(
        (t) => t.status === 'SUCCESS' || t.status === 'PARTIAL_SUCCESS'
      ).length
      const failed = phaseTasks.filter((t) => t.status === 'FAILED').length
      const inProgress = phaseTasks.filter(
        (t) => t.status === 'IN_PROGRESS'
      ).length
      const totalDurationMs = phaseTasks.reduce(
        (acc, t) => acc + (t.durationMs ?? 0),
        0
      )

      return {
        phase_number: phase.number,
        phase_name: phase.name,
        phase_id: phase.id,
        status: phase.status,
        is_parallel: phase.isParallel,
        tasks: {
          total: phaseTasks.length,
          completed,
          failed,
          in_progress: inProgress,
        },
        duration_seconds: Math.round(totalDurationMs / 1000),
        started_at: phase.startedAt?.toISOString() ?? null,
        completed_at: phase.completedAt?.toISOString() ?? null,
      }
    })

    response.phase_summary = phaseSummary
  }

  // Include decisions
  if (include.includes('decisions')) {
    const whereClause: Record<string, unknown> = {}

    if (taskIds.length > 0) {
      whereClause.taskId = { in: taskIds }
    } else if (phaseFilter || agentFilter) {
      // Filters applied but no matching tasks
      whereClause.taskId = { in: [] }
    } else {
      // No filters, get all decisions for workflow tasks
      whereClause.taskId = { in: workflow.tasks.map((t) => t.id) }
    }

    if (sinceDate) {
      whereClause.createdAt = { gte: sinceDate }
    }

    const decisions = await prisma.decision.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        task: {
          select: { name: true, phaseId: true, agentName: true },
        },
      },
    })

    response.decisions = decisions.map((d) => ({
      id: d.id,
      task_id: d.taskId,
      task_name: d.task.name,
      agent_name: d.task.agentName,
      category: d.category,
      question: d.question,
      options_considered: d.optionsConsidered,
      chosen: d.chosen,
      reasoning: d.reasoning,
      trade_offs: d.tradeOffs,
      created_at: d.createdAt.toISOString(),
    }))
    response.decisions_count = decisions.length
  }

  // Include milestones
  if (include.includes('milestones')) {
    const whereClause: Record<string, unknown> = {}

    if (taskIds.length > 0) {
      whereClause.taskId = { in: taskIds }
    } else if (phaseFilter || agentFilter) {
      whereClause.taskId = { in: [] }
    } else {
      whereClause.taskId = { in: workflow.tasks.map((t) => t.id) }
    }

    if (sinceDate) {
      whereClause.createdAt = { gte: sinceDate }
    }

    const milestones = await prisma.milestone.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        task: {
          select: { name: true, agentName: true },
        },
      },
    })

    response.milestones = milestones.map((m) => ({
      id: m.id,
      task_id: m.taskId,
      task_name: m.task.name,
      agent_name: m.task.agentName,
      message: m.message,
      progress: m.progress,
      created_at: m.createdAt.toISOString(),
    }))
    response.milestones_count = milestones.length
  }

  // Include blockers (issues with requiresHumanReview=true)
  if (include.includes('blockers')) {
    const whereClause: Record<string, unknown> = {
      requiresHumanReview: true,
    }

    if (taskIds.length > 0) {
      whereClause.taskId = { in: taskIds }
    } else if (phaseFilter || agentFilter) {
      whereClause.taskId = { in: [] }
    } else {
      whereClause.taskId = { in: workflow.tasks.map((t) => t.id) }
    }

    if (sinceDate) {
      whereClause.createdAt = { gte: sinceDate }
    }

    const blockers = await prisma.issue.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        task: {
          select: { name: true, agentName: true, phaseId: true },
        },
      },
    })

    response.blockers = blockers.map((b) => ({
      id: b.id,
      task_id: b.taskId,
      task_name: b.task.name,
      agent_name: b.task.agentName,
      type: b.type,
      description: b.description,
      resolution: b.resolution,
      created_at: b.createdAt.toISOString(),
    }))
    response.blockers_count = blockers.length
    response.has_blockers = blockers.length > 0
  }

  // Include tasks
  if (include.includes('tasks')) {
    response.tasks = filteredTasks.map((t) => ({
      id: t.id,
      phase_id: t.phaseId,
      name: t.name,
      goal: t.goal,
      status: t.status,
      caller_type: t.callerType,
      agent_name: t.agentName,
      summary: t.summary,
      duration_seconds: t.durationMs ? Math.round(t.durationMs / 1000) : null,
      started_at: t.startedAt.toISOString(),
      completed_at: t.completedAt?.toISOString() ?? null,
      manual_review_needed: t.manualReviewNeeded,
    }))
    response.tasks_count = filteredTasks.length
  }

  // Add filter info to response
  if (filter && (phaseFilter || agentFilter || sinceDate)) {
    response.filters_applied = {
      phase: phaseFilter ?? null,
      agent: agentFilter ?? null,
      since: sinceDate?.toISOString() ?? null,
    }
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
