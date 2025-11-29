'use client'

import Link from 'next/link'
import type { Workflow, Task, Decision, Issue, Milestone } from '@prisma/client'
import { useRealtimeWorkflow } from '@/hooks/useRealtimeWorkflow'
import { StatusBadge } from './StatusBadge'
import { TaskTree } from './TaskTree'

type TaskWithRelations = Task & {
  decisions: Decision[]
  issues: Issue[]
  milestones: Milestone[]
  subtasks?: TaskWithRelations[]
}

type WorkflowWithTasks = Workflow & {
  tasks: TaskWithRelations[]
}

interface RealtimeWorkflowDetailProps {
  initialWorkflow: WorkflowWithTasks
}

function formatDuration(ms: number | null): string {
  if (!ms) return '-'
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function RealtimeWorkflowDetail({
  initialWorkflow,
}: RealtimeWorkflowDetailProps) {
  const { workflow, isConnected, lastUpdate } = useRealtimeWorkflow({
    workflowId: initialWorkflow.id,
    initialData: initialWorkflow,
  })

  if (!workflow) {
    return null
  }

  // Separate root tasks (no parent) from subtasks
  const rootTasks = workflow.tasks.filter((task) => !task.parentTaskId)

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Back to workflows
        </Link>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-gray-400'
            }`}
            title={isConnected ? 'Real-time connected' : 'Disconnected'}
          />
          <span>{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {workflow.name}
            </h1>
            {workflow.description && (
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {workflow.description}
              </p>
            )}
          </div>
          <StatusBadge status={workflow.status} />
        </div>

        <div className="mt-4 flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <span>Created: {formatDate(workflow.createdAt)}</span>
          <span>{workflow.tasks.length} task(s)</span>
        </div>
      </div>

      {/* Plan (if exists) */}
      {workflow.plan &&
        Array.isArray(workflow.plan) &&
        workflow.plan.length > 0 && (
          <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Plan
            </h2>
            <ol className="list-inside list-decimal space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {(workflow.plan as Array<{ step: string; goal: string }>).map(
                (item, index) => (
                  <li key={index}>{item.goal}</li>
                )
              )}
            </ol>
          </div>
        )}

      {/* Tasks */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Tasks
        </h2>

        {rootTasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">No tasks yet</p>
            {isConnected && (
              <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                Tasks will appear here in real-time
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {rootTasks.map((task) => (
              <TaskTree
                key={task.id}
                task={task}
                allTasks={workflow.tasks}
                formatDuration={formatDuration}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
