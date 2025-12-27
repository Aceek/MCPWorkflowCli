/**
 * complete_phase MCP Tool
 *
 * Mark a phase as completed or failed.
 * Called by orchestrator after all tasks in the phase are done.
 */

import { z } from 'zod'
import { prisma } from '../db.js'
import { emitPhaseUpdated, emitWorkflowUpdated } from '../websocket/index.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'
import { PhaseStatus, TaskStatus } from '../types/enums.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

// Zod schema for validation
const completePhaseSchema = z.object({
  phase_id: z.string().min(1),
  status: z.enum(['completed', 'failed']),
  summary: z.string().optional(),
})

// Status conversion map
const phaseStatusMap: Record<string, PhaseStatus> = {
  completed: PhaseStatus.COMPLETED,
  failed: PhaseStatus.FAILED,
}

// MCP Tool definition
export const completePhaseTool = {
  name: 'complete_phase',
  description: 'Mark a phase as completed or failed. Called by orchestrator after all tasks in the phase are done.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      phase_id: {
        type: 'string',
        description: 'Phase ID to complete',
      },
      status: {
        type: 'string',
        enum: ['completed', 'failed'],
        description: 'Final status of the phase',
      },
      summary: {
        type: 'string',
        description: 'Optional summary of what was accomplished in this phase',
      },
    },
    required: ['phase_id', 'status'],
  },
}

// Handler
export async function handleCompletePhase(args: unknown): Promise<CallToolResult> {
  // Validate input
  const validated = completePhaseSchema.parse(args)

  // Fetch phase with tasks
  const phase = await prisma.phase.findUnique({
    where: { id: validated.phase_id },
    include: {
      tasks: {
        select: { id: true, status: true, name: true },
      },
      workflow: true,
    },
  })

  if (!phase) {
    throw new NotFoundError(`Phase not found: ${validated.phase_id}`)
  }

  // Verify phase is IN_PROGRESS
  if (phase.status !== PhaseStatus.IN_PROGRESS) {
    throw new ValidationError(
      `Phase is already ${phase.status}`
    )
  }

  // Calculate task summary
  const taskStats = {
    total: phase.tasks.length,
    success: phase.tasks.filter(t => t.status === TaskStatus.SUCCESS).length,
    partial: phase.tasks.filter(t => t.status === TaskStatus.PARTIAL_SUCCESS).length,
    failed: phase.tasks.filter(t => t.status === TaskStatus.FAILED).length,
    in_progress: phase.tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
  }

  // Warn if tasks are still in progress
  const warnings: string[] = []
  if (taskStats.in_progress > 0) {
    warnings.push(`${taskStats.in_progress} task(s) still in progress`)
  }

  // Update phase
  const newStatus = phaseStatusMap[validated.status]
  const updatedPhase = await prisma.phase.update({
    where: { id: validated.phase_id },
    data: {
      status: newStatus,
      completedAt: new Date(),
      description: validated.summary || phase.description,
    },
  })

  // Emit events
  emitPhaseUpdated(updatedPhase, phase.workflowId)

  // Also emit workflow update (phase progress changed)
  if (phase.workflow) {
    emitWorkflowUpdated(phase.workflow)
  }

  // Calculate duration
  const durationMs = updatedPhase.startedAt
    ? new Date().getTime() - updatedPhase.startedAt.getTime()
    : null

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          phase_id: updatedPhase.id,
          workflow_id: phase.workflowId,
          number: updatedPhase.number,
          name: updatedPhase.name,
          status: newStatus,
          completed_at: updatedPhase.completedAt?.toISOString(),
          duration_ms: durationMs,
          tasks: taskStats,
          warnings: warnings.length > 0 ? warnings : undefined,
        }, null, 2),
      },
    ],
  }
}
