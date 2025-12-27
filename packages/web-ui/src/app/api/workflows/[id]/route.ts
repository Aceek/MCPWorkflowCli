import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api-workflow-detail')

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: {
        phases: {
          include: {
            tasks: {
              include: {
                decisions: {
                  orderBy: { createdAt: 'asc' },
                },
                issues: {
                  orderBy: { createdAt: 'asc' },
                },
                milestones: {
                  orderBy: { createdAt: 'asc' },
                },
                _count: {
                  select: {
                    decisions: true,
                    issues: true,
                    milestones: true,
                  },
                },
              },
              orderBy: { startedAt: 'asc' },
            },
            _count: {
              select: { tasks: true },
            },
          },
          orderBy: { number: 'asc' },
        },
        tasks: {
          include: {
            decisions: {
              orderBy: { createdAt: 'asc' },
            },
            issues: {
              orderBy: { createdAt: 'asc' },
            },
            milestones: {
              orderBy: { createdAt: 'asc' },
            },
            subtasks: {
              include: {
                decisions: true,
                issues: true,
                milestones: true,
              },
            },
          },
          orderBy: { startedAt: 'asc' },
        },
        _count: {
          select: { tasks: true, phases: true },
        },
      },
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Get blockers (issues that are blockers) from all tasks
    const blockers = await prisma.issue.findMany({
      where: {
        task: {
          workflowId: id,
        },
        type: 'BLOCKER',
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

    // Calculate phase stats
    const phasesWithStats = workflow.phases.map((phase) => {
      const completedTasks = phase.tasks.filter(
        (t) => t.status === 'SUCCESS' || t.status === 'COMPLETED'
      ).length
      const totalDuration = phase.tasks.reduce(
        (acc, t) => acc + (t.durationMs ?? 0),
        0
      )

      return {
        ...phase,
        tasksCount: phase.tasks.length,
        completedTasksCount: completedTasks,
        totalDurationMs: totalDuration,
      }
    })

    return NextResponse.json({
      workflow: {
        ...workflow,
        phases: phasesWithStats,
      },
      blockers,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Failed to fetch workflow', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    )
  }
}
