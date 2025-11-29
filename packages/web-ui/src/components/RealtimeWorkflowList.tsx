'use client'

import { useSearchParams } from 'next/navigation'
import { useRealtimeWorkflows } from '@/hooks/useRealtimeWorkflows'
import { WorkflowCard } from './WorkflowCard'
import { StatsCards } from './StatsCards'
import { StatusFilter } from './StatusFilter'
import { WorkflowCardSkeleton, StatsSkeleton } from './Skeleton'

function formatLastUpdate(date: Date | null): string {
  if (!date) return ''
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 5) return 'Just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return date.toLocaleTimeString()
}

export function RealtimeWorkflowList() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status') || undefined

  const { workflows, stats, isLoading, error, lastUpdate, refresh, isConnected } =
    useRealtimeWorkflows({
      status,
    })

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/30">
        <p className="text-red-800 dark:text-red-200">
          Failed to load workflows. Please try again.
        </p>
        <button
          onClick={refresh}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header with real-time indicator */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Workflows
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Track and visualize your agentic workflow executions
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              isConnected
                ? 'bg-green-500'
                : isLoading
                  ? 'animate-pulse bg-yellow-500'
                  : 'bg-gray-400'
            }`}
            title={isConnected ? 'Real-time connected' : 'Disconnected'}
          />
          <span>
            {isConnected
              ? `Live${lastUpdate ? ` • ${formatLastUpdate(lastUpdate)}` : ''}`
              : isLoading
                ? 'Connecting...'
                : 'Offline'}
          </span>
          <button
            onClick={refresh}
            disabled={isLoading}
            className="ml-2 rounded p-1 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
            title="Refresh"
          >
            <svg
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6">
        {isLoading && stats.total === 0 ? (
          <StatsSkeleton />
        ) : (
          <StatsCards stats={stats} />
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center justify-between">
        <StatusFilter />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {workflows.length} result{workflows.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Workflow Grid */}
      {isLoading && workflows.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <WorkflowCardSkeleton key={i} />
          ))}
        </div>
      ) : workflows.length === 0 ? (
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
