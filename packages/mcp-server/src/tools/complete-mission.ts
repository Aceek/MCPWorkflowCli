/**
 * complete_mission MCP Tool
 *
 * Finalize a mission and aggregate metrics.
 */

import { z } from 'zod'
import { prisma } from '../db.js'
import { emitMissionUpdated } from '../websocket/index.js'
import { MissionStatus, missionStatusMap } from '../types/enums.js'
import { NotFoundError } from '../utils/errors.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

// Zod schema for validation
const completeMissionSchema = z.object({
  mission_id: z.string().min(1),
  status: z.enum(['completed', 'failed', 'partial']),
  summary: z.string().min(1),
  achievements: z.array(z.string()).optional(),
  limitations: z.array(z.string()).optional(),
})

// MCP Tool definition
export const completeMissionTool = {
  name: 'complete_mission',
  description: 'Finalize a mission and aggregate metrics',
  inputSchema: {
    type: 'object' as const,
    properties: {
      mission_id: {
        type: 'string',
        description: 'The mission ID to complete',
      },
      status: {
        type: 'string',
        enum: ['completed', 'failed', 'partial'],
        description: 'Final status of the mission',
      },
      summary: {
        type: 'string',
        description: 'Summary of what was accomplished',
      },
      achievements: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of achievements during the mission',
      },
      limitations: {
        type: 'array',
        items: { type: 'string' },
        description: 'List of limitations or issues encountered',
      },
    },
    required: ['mission_id', 'status', 'summary'],
  },
}

// Map MCP status to MissionStatus
const statusToMissionStatus: Record<string, MissionStatus> = {
  completed: MissionStatus.COMPLETED,
  failed: MissionStatus.FAILED,
  partial: MissionStatus.COMPLETED, // Partial success is still completed
}

// Handler
export async function handleCompleteMission(
  args: unknown
): Promise<CallToolResult> {
  // Validate input
  const validated = completeMissionSchema.parse(args)

  // Verify mission exists
  const existingMission = await prisma.mission.findUnique({
    where: { id: validated.mission_id },
    include: {
      phases: {
        include: {
          tasks: true,
        },
      },
    },
  })

  if (!existingMission) {
    throw new NotFoundError(`Mission not found: ${validated.mission_id}`)
  }

  // Calculate mission metrics
  const totalTasks = existingMission.phases.reduce(
    (sum, phase) => sum + phase.tasks.length,
    0
  )

  const totalDurationMs = existingMission.phases.reduce((sum, phase) => {
    return (
      sum +
      phase.tasks.reduce((taskSum, task) => taskSum + (task.durationMs || 0), 0)
    )
  }, 0)

  // Aggregate files changed across all tasks
  const filesChanged = new Set<string>()
  existingMission.phases.forEach((phase) => {
    phase.tasks.forEach((task) => {
      const added = JSON.parse(task.filesAdded || '[]') as string[]
      const modified = JSON.parse(task.filesModified || '[]') as string[]
      const deleted = JSON.parse(task.filesDeleted || '[]') as string[]
      added.forEach((f) => filesChanged.add(f))
      modified.forEach((f) => filesChanged.add(f))
      deleted.forEach((f) => filesChanged.add(f))
    })
  })

  // Update mission status
  const mission = await prisma.mission.update({
    where: { id: validated.mission_id },
    data: {
      status: statusToMissionStatus[validated.status],
      completedAt: new Date(),
      currentPhase: existingMission.totalPhases, // Mark as complete
    },
  })

  // Emit WebSocket event
  emitMissionUpdated(mission)

  // Calculate total duration in a readable format
  const durationSeconds = Math.round(totalDurationMs / 1000)
  const durationMinutes = Math.round(durationSeconds / 60)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            mission_id: mission.id,
            status: validated.status,
            summary: validated.summary,
            achievements: validated.achievements || [],
            limitations: validated.limitations || [],
            metrics: {
              total_phases: existingMission.phases.length,
              total_tasks: totalTasks,
              total_duration_seconds: durationSeconds,
              total_duration_minutes: durationMinutes,
              files_changed: filesChanged.size,
            },
            completed_at: mission.completedAt?.toISOString(),
          },
          null,
          2
        ),
      },
    ],
  }
}
