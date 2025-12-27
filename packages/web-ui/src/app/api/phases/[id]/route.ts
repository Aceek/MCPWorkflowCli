import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api-phase-detail')

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    const phase = await prisma.phase.findUnique({
      where: { id },
      include: {
        mission: {
          select: {
            id: true,
            name: true,
            objective: true,
            status: true,
          },
        },
        tasks: {
          orderBy: { startedAt: 'asc' },
          include: {
            decisions: {
              orderBy: { createdAt: 'desc' },
            },
            issues: {
              orderBy: { createdAt: 'desc' },
            },
            milestones: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    })

    if (!phase) {
      return NextResponse.json(
        { error: 'Phase not found' },
        { status: 404 }
      )
    }

    // Calculate phase stats
    const totalDurationMs = phase.tasks.reduce(
      (sum, task) => sum + (task.durationMs || 0),
      0
    )

    const taskStats = {
      total: phase.tasks.length,
      completed: phase.tasks.filter(
        (t) => t.status === 'SUCCESS' || t.status === 'PARTIAL_SUCCESS'
      ).length,
      failed: phase.tasks.filter((t) => t.status === 'FAILED').length,
      inProgress: phase.tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    }

    return NextResponse.json({
      phase: {
        ...phase,
        totalDurationMs,
        taskStats,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Failed to fetch phase', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Failed to fetch phase' },
      { status: 500 }
    )
  }
}
