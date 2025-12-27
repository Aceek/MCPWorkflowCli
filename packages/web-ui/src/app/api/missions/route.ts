import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('api-missions')

export const dynamic = 'force-dynamic'

// Status string constants (SQLite stores enums as strings)
type MissionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'BLOCKED'

// Zod schema for status validation
const statusSchema = z
  .enum(['all', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'BLOCKED'])
  .optional()
  .default('all')

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawStatus = searchParams.get('status')

    // Validate status parameter
    const parseResult = statusSchema.safeParse(rawStatus ?? undefined)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid status parameter' },
        { status: 400 }
      )
    }
    const status = parseResult.data

    const where =
      status && status !== 'all'
        ? { status: status as MissionStatus }
        : undefined

    const [missions, stats] = await Promise.all([
      prisma.mission.findMany({
        where,
        include: {
          phases: {
            orderBy: { number: 'asc' },
            include: {
              _count: {
                select: { tasks: true },
              },
            },
          },
          _count: {
            select: { phases: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      Promise.all([
        prisma.mission.count(),
        prisma.mission.count({ where: { status: 'PENDING' } }),
        prisma.mission.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.mission.count({ where: { status: 'COMPLETED' } }),
        prisma.mission.count({ where: { status: 'FAILED' } }),
        prisma.mission.count({ where: { status: 'BLOCKED' } }),
      ]).then(([total, pending, inProgress, completed, failed, blocked]) => ({
        total,
        pending,
        inProgress,
        completed,
        failed,
        blocked,
      })),
    ])

    return NextResponse.json({
      missions,
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Failed to fetch missions', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Failed to fetch missions' },
      { status: 500 }
    )
  }
}
