import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { RealtimeWorkflowDetail } from '@/components/workflow/RealtimeWorkflowDetail'

export const dynamic = 'force-dynamic'

interface WorkflowPageProps {
  params: Promise<{ id: string }>
}

async function getWorkflow(id: string) {
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
    },
  })

  if (!workflow) return null

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

  return {
    ...workflow,
    phases: phasesWithStats,
  }
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const { id } = await params
  const workflow = await getWorkflow(id)

  if (!workflow) {
    notFound()
  }

  return <RealtimeWorkflowDetail initialWorkflow={workflow} />
}
