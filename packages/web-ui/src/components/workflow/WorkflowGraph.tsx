'use client'

import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  AlertCircle,
  GitBranch,
  Bot,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/date-utils'
import type { PhaseWithStats } from '@/lib/api'

interface WorkflowGraphProps {
  phases: PhaseWithStats[]
  className?: string
}

const phaseStatusConfig = {
  PENDING: {
    icon: Circle,
    color: 'text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-300 dark:border-gray-600',
    line: 'bg-gray-300 dark:bg-gray-600',
  },
  IN_PROGRESS: {
    icon: Loader2,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-400 dark:border-blue-500',
    line: 'bg-blue-400 dark:bg-blue-500',
  },
  COMPLETED: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-400 dark:border-green-500',
    line: 'bg-green-400 dark:bg-green-500',
  },
  FAILED: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-400 dark:border-red-500',
    line: 'bg-red-400 dark:bg-red-500',
  },
}

const taskStatusConfig = {
  IN_PROGRESS: { color: 'bg-blue-500', ring: 'ring-blue-200 dark:ring-blue-800' },
  SUCCESS: { color: 'bg-green-500', ring: 'ring-green-200 dark:ring-green-800' },
  COMPLETED: { color: 'bg-green-500', ring: 'ring-green-200 dark:ring-green-800' },
  PARTIAL_SUCCESS: { color: 'bg-yellow-500', ring: 'ring-yellow-200 dark:ring-yellow-800' },
  FAILED: { color: 'bg-red-500', ring: 'ring-red-200 dark:ring-red-800' },
  PENDING: { color: 'bg-gray-400', ring: 'ring-gray-200 dark:ring-gray-700' },
}

export function WorkflowGraph({ phases, className }: WorkflowGraphProps) {
  if (phases.length === 0) {
    return (
      <Card className={cn('p-6 text-center text-[hsl(var(--muted-foreground))]', className)}>
        <Circle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No phases to display</p>
      </Card>
    )
  }

  return (
    <Card className={cn('p-6 overflow-x-auto', className)}>
      <div className="min-w-[600px]">
        {/* Graph container */}
        <div className="relative">
          {phases.map((phase, phaseIndex) => {
            const config = phaseStatusConfig[phase.status as keyof typeof phaseStatusConfig] || phaseStatusConfig.PENDING
            const StatusIcon = config.icon
            const isLast = phaseIndex === phases.length - 1
            const tasks = phase.tasks || []

            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: phaseIndex * 0.1 }}
                className="relative"
              >
                {/* Phase node */}
                <div className="flex items-start gap-4">
                  {/* Phase icon and connector */}
                  <div className="flex flex-col items-center">
                    {/* Phase circle */}
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center border-2',
                        config.bg,
                        config.border
                      )}
                    >
                      <StatusIcon
                        className={cn(
                          'h-6 w-6',
                          config.color,
                          phase.status === 'IN_PROGRESS' && 'animate-spin'
                        )}
                      />
                    </div>

                    {/* Vertical connector to tasks */}
                    {tasks.length > 0 && (
                      <div className={cn('w-0.5 h-6', config.line)} />
                    )}
                  </div>

                  {/* Phase info */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                        Phase {phase.number}
                      </span>
                      {phase.isParallel && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <GitBranch className="h-3 w-3" />
                          Parallel
                        </Badge>
                      )}
                      {phase.totalDurationMs && phase.totalDurationMs > 0 && (
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">
                          {formatDuration(phase.totalDurationMs)}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-[hsl(var(--foreground))]">
                      {phase.name}
                    </h3>
                    {phase.description && (
                      <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                        {phase.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tasks branch */}
                {tasks.length > 0 && (
                  <div className="ml-6 relative">
                    {/* Horizontal branch line */}
                    <div
                      className={cn(
                        'absolute left-0 top-0 w-8 h-0.5',
                        config.line
                      )}
                    />

                    {/* Tasks container */}
                    <div
                      className={cn(
                        'ml-8 flex gap-3 py-4',
                        phase.isParallel ? 'flex-row flex-wrap' : 'flex-col'
                      )}
                    >
                      {tasks.map((task, taskIndex) => {
                        const taskConfig = taskStatusConfig[task.status as keyof typeof taskStatusConfig] || taskStatusConfig.PENDING

                        return (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: phaseIndex * 0.1 + taskIndex * 0.05 }}
                            className="relative"
                          >
                            {/* Task connector line (for sequential tasks) */}
                            {!phase.isParallel && taskIndex > 0 && (
                              <div
                                className={cn(
                                  'absolute -top-4 left-4 w-0.5 h-4',
                                  config.line
                                )}
                              />
                            )}

                            {/* Task card */}
                            <Tooltip content={task.goal || task.name}>
                              <div
                                className={cn(
                                  'group relative p-3 rounded-lg border bg-[hsl(var(--card))]',
                                  'hover:shadow-md transition-shadow cursor-pointer',
                                  'min-w-[180px] max-w-[250px]',
                                  task.status === 'IN_PROGRESS' && 'ring-2 ring-offset-2',
                                  taskConfig.ring
                                )}
                              >
                                {/* Status indicator */}
                                <div
                                  className={cn(
                                    'absolute -left-1.5 top-4 w-3 h-3 rounded-full border-2 border-[hsl(var(--card))]',
                                    taskConfig.color,
                                    task.status === 'IN_PROGRESS' && 'animate-pulse'
                                  )}
                                />

                                {/* Task content */}
                                <div className="pl-2">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    {task.agentName && (
                                      <Bot className="h-3 w-3 text-blue-500" />
                                    )}
                                    <span className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                                      {task.agentName || 'orchestrator'}
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium truncate">
                                    {task.name}
                                  </p>
                                  {task.durationMs && (
                                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                                      {formatDuration(task.durationMs)}
                                    </p>
                                  )}
                                </div>

                                {/* Stats badges */}
                                <div className="flex gap-1 mt-2 flex-wrap">
                                  {task.decisions && task.decisions.length > 0 && (
                                    <Badge variant="secondary" className="text-xs py-0">
                                      {task.decisions.length} dec
                                    </Badge>
                                  )}
                                  {task.milestones && task.milestones.length > 0 && (
                                    <Badge variant="secondary" className="text-xs py-0">
                                      {task.milestones.length} ms
                                    </Badge>
                                  )}
                                  {task.issues && task.issues.length > 0 && (
                                    <Badge variant="destructive" className="text-xs py-0">
                                      {task.issues.length} issues
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </Tooltip>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Connector to next phase */}
                {!isLast && (
                  <div className="ml-6 flex flex-col items-center py-2">
                    <div
                      className={cn(
                        'w-0.5 h-8',
                        config.line
                      )}
                    />
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        config.line
                      )}
                    />
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
