import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { WorkflowStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

// Zod schema for status validation
const statusSchema = z
  .enum(['all', 'IN_PROGRESS', 'COMPLETED', 'FAILED'])
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
        ? { status: status as WorkflowStatus }
        : undefined

    const [workflows, stats] = await Promise.all([
      prisma.workflow.findMany({
        where,
        include: {
          _count: {
            select: { tasks: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      Promise.all([
        prisma.workflow.count(),
        prisma.workflow.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.workflow.count({ where: { status: 'COMPLETED' } }),
        prisma.workflow.count({ where: { status: 'FAILED' } }),
      ]).then(([total, inProgress, completed, failed]) => ({
        total,
        inProgress,
        completed,
        failed,
      })),
    ])

    return NextResponse.json({
      workflows,
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    )
  }
}
