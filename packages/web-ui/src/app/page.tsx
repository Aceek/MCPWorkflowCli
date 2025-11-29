import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { WorkflowCard } from '@/components/WorkflowCard'
import { StatsCards } from '@/components/StatsCards'
import { StatusFilter } from '@/components/StatusFilter'
import { WorkflowStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface HomePageProps {
  searchParams: Promise<{ status?: string }>
}

async function getWorkflows(statusFilter?: string) {
  const where =
    statusFilter && statusFilter !== 'all'
      ? { status: statusFilter as WorkflowStatus }
      : undefined

  return prisma.workflow.findMany({
    where,
    include: {
      _count: {
        select: { tasks: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

async function getStats() {
  const [total, inProgress, completed, failed] = await Promise.all([
    prisma.workflow.count(),
    prisma.workflow.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.workflow.count({ where: { status: 'COMPLETED' } }),
    prisma.workflow.count({ where: { status: 'FAILED' } }),
  ])

  return { total, inProgress, completed, failed }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { status } = await searchParams
  const [workflows, stats] = await Promise.all([
    getWorkflows(status),
    getStats(),
  ])

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Workflows
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Track and visualize your agentic workflow executions
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <StatsCards stats={stats} />
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center justify-between">
        <Suspense fallback={<div className="h-9" />}>
          <StatusFilter />
        </Suspense>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {workflows.length} result{workflows.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Workflow Grid */}
      {workflows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            {status && status !== 'all'
              ? 'No workflows with this status'
              : 'No workflows yet'}
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {status && status !== 'all'
              ? 'Try changing the filter or create a new workflow.'
              : 'Start a workflow using the MCP tools to see it here.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => (
            <WorkflowCard key={workflow.id} workflow={workflow} />
          ))}
        </div>
      )}
    </div>
  )
}
