import { prisma } from '@/lib/prisma'
import { WorkflowCard } from '@/components/WorkflowCard'

export const dynamic = 'force-dynamic'

async function getWorkflows() {
  return prisma.workflow.findMany({
    include: {
      _count: {
        select: { tasks: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function HomePage() {
  const workflows = await getWorkflows()

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Workflows
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
      </div>

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
            No workflows yet
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Start a workflow using the MCP tools to see it here.
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
