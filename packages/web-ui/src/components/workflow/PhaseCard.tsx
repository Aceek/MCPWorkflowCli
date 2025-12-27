'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Clock, CheckCircle2, Circle, AlertCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AgentBadge } from './AgentBadge'
import { formatDuration } from '@/lib/date-utils'
import type { PhaseWithStats } from '@/lib/api'
import { cn } from '@/lib/utils'

interface PhaseCardProps {
  phase: PhaseWithStats
  isActive?: boolean
}

const statusConfig = {
  PENDING: {
    icon: Circle,
    color: 'text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800',
  },
  IN_PROGRESS: {
    icon: Loader2,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950',
  },
  COMPLETED: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-950',
  },
  FAILED: {
    icon: AlertCircle,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-950',
  },
}

export function PhaseCard({ phase, isActive = false }: PhaseCardProps) {
  const [isOpen, setIsOpen] = useState(isActive)
  const config = statusConfig[phase.status as keyof typeof statusConfig] || statusConfig.PENDING
  const StatusIcon = config.icon

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card
        className={cn(
          'overflow-hidden transition-all',
          isActive && 'ring-2 ring-[hsl(var(--primary))]'
        )}
      >
        <CollapsibleTrigger className="w-full">
          <div className={cn('p-4 flex items-center gap-4', config.bg)}>
            {/* Status icon */}
            <div className={cn('flex-shrink-0', config.color)}>
              <StatusIcon
                className={cn('h-6 w-6', phase.status === 'IN_PROGRESS' && 'animate-spin')}
              />
            </div>

            {/* Phase info */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                  Phase {phase.number}
                </span>
                {phase.isParallel && (
                  <Badge variant="outline" className="text-xs">
                    Parallel
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-[hsl(var(--foreground))] truncate">
                {phase.name}
              </h3>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
              {phase.totalDurationMs && phase.totalDurationMs > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(phase.totalDurationMs)}
                </span>
              )}
              <span>
                {phase.completedTasksCount || 0}/{phase.tasksCount || 0} tasks
              </span>
              <ChevronDown
                className={cn(
                  'h-5 w-5 transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <AnimatePresence>
            {isOpen && phase.tasks && phase.tasks.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-[hsl(var(--border))]"
              >
                <div className="p-4 space-y-3">
                  {phase.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--muted)/0.3)]"
                    >
                      {/* Task status indicator */}
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full flex-shrink-0',
                          task.status === 'SUCCESS' && 'bg-green-500',
                          task.status === 'PARTIAL_SUCCESS' && 'bg-yellow-500',
                          task.status === 'FAILED' && 'bg-red-500',
                          task.status === 'IN_PROGRESS' && 'bg-blue-500 animate-pulse'
                        )}
                      />

                      {/* Task info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{task.name}</p>
                        {task.agentName && (
                          <AgentBadge
                            agentName={task.agentName}
                            callerType={task.callerType}
                            className="mt-1"
                          />
                        )}
                      </div>

                      {/* Task stats */}
                      <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                        {task._count.decisions > 0 && (
                          <span>{task._count.decisions} decisions</span>
                        )}
                        {task._count.milestones > 0 && (
                          <span>{task._count.milestones} milestones</span>
                        )}
                        {task.durationMs && (
                          <span>{formatDuration(task.durationMs)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
