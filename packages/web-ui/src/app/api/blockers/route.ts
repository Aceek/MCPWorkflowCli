import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api-blockers')

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Fetch all issues that require human review (blockers)
    const blockers = await prisma.issue.findMany({
      where: {
        requiresHumanReview: true,
      },
      include: {
        task: {
          select: {
            id: true,
            name: true,
            phaseId: true,
            workflow: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20, // Limit to 20 most recent
    })

    // Transform to include workflow info at top level
    const transformedBlockers = blockers.map((blocker) => ({
      id: blocker.id,
      type: blocker.type,
      description: blocker.description,
      resolution: blocker.resolution,
      requiresHumanReview: blocker.requiresHumanReview,
      createdAt: blocker.createdAt,
      task: {
        id: blocker.task.id,
        name: blocker.task.name,
        phaseId: blocker.task.phaseId,
      },
      workflow: blocker.task.workflow,
    }))

    return NextResponse.json({
      blockers: transformedBlockers,
      count: transformedBlockers.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Failed to fetch blockers', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Failed to fetch blockers' },
      { status: 500 }
    )
  }
}
