import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api-mission-detail')

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    const mission = await prisma.mission.findUnique({
      where: { id },
      include: {
        phases: {
          orderBy: { number: 'asc' },
          include: {
            tasks: {
              orderBy: { startedAt: 'asc' },
              include: {
                _count: {
                  select: {
                    decisions: true,
                    issues: true,
                    milestones: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!mission) {
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404 }
      )
    }

    // Get blockers (issues with requiresHumanReview = true)
    const blockers = await prisma.issue.findMany({
      where: {
        task: {
          phase: {
            missionId: id,
          },
        },
        requiresHumanReview: true,
      },
      include: {
        task: {
          select: {
            id: true,
            name: true,
            phaseId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate phase durations
    const phasesWithDuration = mission.phases.map((phase) => {
      const totalDurationMs = phase.tasks.reduce(
        (sum, task) => sum + (task.durationMs || 0),
        0
      )
      return {
        ...phase,
        totalDurationMs,
        tasksCount: phase.tasks.length,
        completedTasksCount: phase.tasks.filter(
          (t) => t.status === 'SUCCESS' || t.status === 'PARTIAL_SUCCESS'
        ).length,
      }
    })

    return NextResponse.json({
      mission: {
        ...mission,
        phases: phasesWithDuration,
      },
      blockers,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Failed to fetch mission', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Failed to fetch mission' },
      { status: 500 }
    )
  }
}
