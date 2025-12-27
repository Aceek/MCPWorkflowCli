/**
 * start_mission MCP Tool
 *
 * Initialize a new mission tracking session.
 * Replaces start_workflow for mission-based orchestration.
 */

import { z } from 'zod'
import { prisma } from '../db.js'
import { emitMissionCreated } from '../websocket/index.js'
import { MissionProfile, MissionStatus, missionProfileMap } from '../types/enums.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

// Zod schema for validation
const startMissionSchema = z.object({
  name: z.string().min(1).max(200),
  objective: z.string().min(1),
  description: z.string().optional(),
  profile: z.enum(['simple', 'standard', 'complex']).optional().default('standard'),
  total_phases: z.number().int().min(1).max(20).optional(),
  scope: z.string().optional(),
  constraints: z.string().optional(),
})

// MCP Tool definition
export const startMissionTool = {
  name: 'start_mission',
  description: 'Initialize a new mission tracking session for multi-phase orchestration',
  inputSchema: {
    type: 'object' as const,
    properties: {
      name: {
        type: 'string',
        description: "Short mission name (e.g., 'Implement auth system')",
      },
      objective: {
        type: 'string',
        description: 'Measurable goal for the mission',
      },
      description: {
        type: 'string',
        description: 'Detailed description of the mission',
      },
      profile: {
        type: 'string',
        enum: ['simple', 'standard', 'complex'],
        description: 'Mission complexity profile (simple=2 phases, standard=3, complex=4+)',
      },
      total_phases: {
        type: 'number',
        description: 'Expected number of phases (for progress tracking)',
      },
      scope: {
        type: 'string',
        description: "What's included/excluded from this mission",
      },
      constraints: {
        type: 'string',
        description: 'Technical constraints or limitations',
      },
    },
    required: ['name', 'objective'],
  },
}

// Handler
export async function handleStartMission(
  args: unknown
): Promise<CallToolResult> {
  // Validate input
  const validated = startMissionSchema.parse(args)

  // Convert profile to enum value
  const profile = missionProfileMap[validated.profile] || MissionProfile.STANDARD

  // Determine default phases based on profile if not specified
  let totalPhases = validated.total_phases
  if (!totalPhases) {
    switch (profile) {
      case MissionProfile.SIMPLE:
        totalPhases = 2
        break
      case MissionProfile.STANDARD:
        totalPhases = 3
        break
      case MissionProfile.COMPLEX:
        totalPhases = 4
        break
      default:
        totalPhases = 3
    }
  }

  // Create mission in database
  const mission = await prisma.mission.create({
    data: {
      name: validated.name,
      objective: validated.objective,
      description: validated.description,
      profile: profile,
      totalPhases: totalPhases,
      scope: validated.scope,
      constraints: validated.constraints,
      status: MissionStatus.PENDING,
    },
  })

  // Emit WebSocket event for real-time UI update
  emitMissionCreated(mission)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            mission_id: mission.id,
            profile: mission.profile,
            total_phases: mission.totalPhases,
            created_at: mission.createdAt.toISOString(),
          },
          null,
          2
        ),
      },
    ],
  }
}
