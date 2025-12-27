'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Clock, CheckCircle2, Circle, AlertCircle, Loader2, Play, Flag } from 'lucide-react'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { TaskCard } from '../task/TaskCard'
import { formatDuration, formatTime } from '@/lib/date-utils'
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
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-[hsl(var(--border))]"
              >
                {/* Phase timing bar */}
                {(phase.startedAt || phase.completedAt) && (
                  <div className="px-4 py-3 bg-[hsl(var(--muted)/0.3)] border-b border-[hsl(var(--border))]">
                    <div className="flex items-center gap-4 text-xs">
                      {/* Start time */}
                      <div className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))]">
                        <Play className="h-3 w-3 text-green-500" />
                        <span>Started: {formatTime(phase.startedAt)}</span>
                      </div>

                      {/* Duration bar */}
                      <div className="flex-1 relative h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: phase.status === 'COMPLETED' || phase.status === 'FAILED' ? '100%' : '60%' }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className={cn(
                            'absolute left-0 top-0 h-full rounded-full',
                            phase.status === 'COMPLETED' && 'bg-green-500',
                            phase.status === 'FAILED' && 'bg-red-500',
                            phase.status === 'IN_PROGRESS' && 'bg-blue-500 animate-pulse',
                            phase.status === 'PENDING' && 'bg-gray-400'
                          )}
                        />
                      </div>

                      {/* End time or in progress */}
                      <div className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))]">
                        {phase.completedAt ? (
                          <>
                            <Flag className="h-3 w-3 text-blue-500" />
                            <span>Ended: {formatTime(phase.completedAt)}</span>
                          </>
                        ) : phase.status === 'IN_PROGRESS' ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                            <span>In progress...</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tasks list */}
                {phase.tasks && phase.tasks.length > 0 && (
                  <div className="p-4 space-y-4">
                    {phase.tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        formatDuration={formatDuration}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
