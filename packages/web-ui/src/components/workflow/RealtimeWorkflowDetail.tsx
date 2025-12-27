'use client'

import Link from 'next/link'
import type { Workflow, Task, Decision, Issue, Milestone } from '@prisma/client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ArrowLeft, Wifi, WifiOff, ClipboardList, Calendar, ListTodo, Clock, Zap, Layers, GitBranch, List } from 'lucide-react'
import { useRealtimeWorkflow } from '@/hooks/useRealtimeWorkflow'
import { StatusBadge } from '../shared/StatusBadge'
import { TaskTree } from '../task/TaskTree'
import { PhaseTimeline } from './PhaseTimeline'
import { WorkflowGraph } from './WorkflowGraph'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { EmptyState } from '@/components/ui/empty-state'
import { Tooltip } from '@/components/ui/tooltip'
import { StaggerList, StaggerItem } from '@/components/ui/motion'
import { cn } from '@/lib/utils'
import { parseJsonArraySafe } from '@/lib/json-parse'
import { WorkflowPlanSchema } from '@/lib/json-schemas'
import { formatDate, formatDuration } from '@/lib/date-utils'
import { formatTokens } from '@/lib/format-utils'
import type { PhaseWithStats } from '@/lib/api'

type TaskWithRelations = Task & {
  decisions: Decision[]
  issues: Issue[]
  milestones: Milestone[]
  subtasks?: TaskWithRelations[]
}

type WorkflowWithTasks = Workflow & {
  tasks: TaskWithRelations[]
  phases?: PhaseWithStats[]
}

interface RealtimeWorkflowDetailProps {
  initialWorkflow: WorkflowWithTasks
}

export function RealtimeWorkflowDetail({
  initialWorkflow,
}: RealtimeWorkflowDetailProps) {
  const [viewMode, setViewMode] = useState<'graph' | 'timeline'>('graph')
  const { workflow, isConnected, lastUpdate } = useRealtimeWorkflow({
    workflowId: initialWorkflow.id,
    initialData: initialWorkflow,
  })

  if (!workflow) {
    return null
  }

  // Separate root tasks (no parent) from subtasks
  const rootTasks = workflow.tasks.filter((task) => !task.parentTaskId)

  // Separate orphan tasks (tasks without phaseId) from phase tasks
  const orphanTasks = rootTasks.filter((task) => !task.phaseId)
  const hasPhases = workflow.phases && workflow.phases.length > 0

  // Calculate current active phase
  const currentPhase = workflow.phases?.find(
    (p) => p.status === 'IN_PROGRESS'
  )?.number ?? workflow.phases?.length ?? 1

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
          const plan = parseJsonArraySafe(workflow.plan, WorkflowPlanSchema)
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

      {/* Phases */}
      {hasPhases && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
              <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                Phases
              </h2>
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                ({workflow.phases!.length})
              </span>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[hsl(var(--muted))]">
              <Button
                variant={viewMode === 'graph' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('graph')}
                className="h-8 px-3 gap-1.5"
              >
                <GitBranch className="h-4 w-4" />
                Graph
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('timeline')}
                className="h-8 px-3 gap-1.5"
              >
                <List className="h-4 w-4" />
                Timeline
              </Button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'graph' ? (
              <motion.div
                key="graph"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <WorkflowGraph phases={workflow.phases!} />
              </motion.div>
            ) : (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <PhaseTimeline
                  phases={workflow.phases!}
                  currentPhase={currentPhase}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Orphan Tasks (tasks without phase) */}
      {orphanTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: hasPhases ? 0.4 : 0.3 }}
        >
          <h2 className="mb-4 text-xl font-semibold text-[hsl(var(--foreground))]">
            {hasPhases ? 'Unassigned Tasks' : 'Tasks'}
          </h2>

          <div className="space-y-4">
            {orphanTasks.map((task) => (
              <TaskTree
                key={task.id}
                task={task}
                allTasks={workflow.tasks}
                formatDuration={formatDuration}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state when no phases and no tasks */}
      {!hasPhases && orphanTasks.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
      )}
    </motion.div>
  )
}
