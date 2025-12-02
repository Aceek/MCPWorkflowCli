import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { RealtimeWorkflowDetail } from '@/components/workflow/RealtimeWorkflowDetail'

export const dynamic = 'force-dynamic'

interface WorkflowPageProps {
  params: Promise<{ id: string }>
}

async function getWorkflow(id: string) {
  return prisma.workflow.findUnique({
    where: { id },
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
    },
  })
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const { id } = await params
  const workflow = await getWorkflow(id)

  if (!workflow) {
    notFound()
  }

  return <RealtimeWorkflowDetail initialWorkflow={workflow} />
}
