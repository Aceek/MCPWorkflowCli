'use client'

import Link from 'next/link'
import type { Workflow, Task, Decision, Issue, Milestone } from '@prisma/client'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Wifi, WifiOff, ClipboardList, Calendar, ListTodo, Clock, Zap } from 'lucide-react'
import { useRealtimeWorkflow } from '@/hooks/useRealtimeWorkflow'
import { StatusBadge } from './StatusBadge'
import { TaskTree } from './TaskTree'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/ui/empty-state'
import { Tooltip } from '@/components/ui/tooltip'
import { StaggerList, StaggerItem } from '@/components/ui/motion'
import { cn } from '@/lib/utils'
import { parseJsonArray } from '@/lib/json-parse'

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

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) {
    return 'Date invalide'
  }
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

function formatTokens(tokens: number | null): string {
  if (!tokens) return '-'
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`
  }
  return tokens.toString()
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Breadcrumb */}
      <nav className="flex items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to workflows
        </Link>

        {/* Connection status */}
        <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
          <Tooltip content={isConnected ? 'Real-time updates active' : 'Disconnected'}>
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  'absolute inline-flex h-full w-full rounded-[var(--radius-full)]',
                  isConnected
                    ? 'bg-[hsl(var(--success))] animate-ping opacity-75'
                    : 'bg-[hsl(var(--muted-foreground))]'
                )}
              />
              <span
                className={cn(
                  'relative inline-flex h-2 w-2 rounded-[var(--radius-full)]',
                  isConnected
                    ? 'bg-[hsl(var(--success))]'
                    : 'bg-[hsl(var(--muted-foreground))]'
                )}
              />
            </span>
          </Tooltip>
          <span>{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">
              {workflow.name}
            </h1>
            {workflow.description && (
              <p className="mt-2 text-[hsl(var(--muted-foreground))] max-w-2xl">
                {workflow.description}
              </p>
            )}
          </div>
          <StatusBadge status={workflow.status} size="lg" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Created: {formatDate(workflow.createdAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <ListTodo className="h-4 w-4" />
            {workflow.tasks.length} task{workflow.tasks.length !== 1 ? 's' : ''}
          </span>
          {workflow.totalDurationMs && workflow.totalDurationMs > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Total: {formatDuration(workflow.totalDurationMs)}
            </span>
          )}
          {workflow.totalTokens && workflow.totalTokens > 0 && (
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4" />
              {formatTokens(workflow.totalTokens)} tokens
            </span>
          )}
        </div>
      </motion.div>

      {/* Plan (if exists) */}
      <AnimatePresence>
        {(() => {
          const plan = parseJsonArray<{ step: string; goal: string }>(workflow.plan)
          return plan.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-5 bg-[hsl(var(--muted)/0.3)]">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                  Plan
                </h2>
                <ol className="list-inside list-decimal space-y-1.5 text-sm text-[hsl(var(--foreground)/0.9)]">
                  {plan.map((item, index) => (
                    <li key={index} className="leading-relaxed">
                      {item.goal}
                    </li>
                  ))}
                </ol>
              </Card>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* Tasks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="mb-4 text-xl font-semibold text-[hsl(var(--foreground))]">
          Tasks
        </h2>

        <AnimatePresence mode="wait">
          {rootTasks.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyState
                icon={<ClipboardList className="h-8 w-8" />}
                title="No tasks yet"
                description={
                  isConnected
                    ? 'Tasks will appear here in real-time as they are created.'
                    : 'Connect to see real-time updates.'
                }
              />
            </motion.div>
          ) : (
            <motion.div
              key="tasks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {rootTasks.map((task) => (
                <TaskTree
                  key={task.id}
                  task={task}
                  allTasks={workflow.tasks}
                  formatDuration={formatDuration}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
