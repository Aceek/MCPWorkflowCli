'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ExternalLink, CheckCircle2, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

interface Blocker {
  id: string
  type: string
  description: string
  resolution: string | null
  requiresHumanReview: boolean
  createdAt: Date | string
  task: {
    id: string
    name: string
    phaseId: string | null
  }
  workflow: {
    id: string
    name: string
  }
}

interface BlockersPanelProps {
  blockers: Blocker[]
  className?: string
}

const typeColors: Record<string, string> = {
  DOCUMENTATION_GAP: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700',
  BUG_ENCOUNTERED: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
  DEPENDENCY_CONFLICT: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700',
  UNCLEAR_REQUIREMENT: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
  BLOCKER: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700',
}

export function BlockersPanel({ blockers, className }: BlockersPanelProps) {
  if (blockers.length === 0) {
    return (
      <Card className={cn('p-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30', className)}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-green-800 dark:text-green-200">
              No Blockers
            </h3>
            <p className="text-sm text-green-600 dark:text-green-400">
              All workflows are running smoothly
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn('overflow-hidden border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30', className)}>
      {/* Header */}
      <div className="p-4 border-b border-amber-200 dark:border-amber-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                {blockers.length} Blocker{blockers.length !== 1 ? 's' : ''} Requiring Attention
              </h3>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Human review needed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Blockers list */}
      <div className="divide-y divide-amber-200 dark:divide-amber-800">
        <AnimatePresence>
          {blockers.slice(0, 5).map((blocker, index) => (
            <motion.div
              key={blocker.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  {/* Type and workflow badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge
                      variant="outline"
                      className={cn('text-xs', typeColors[blocker.type] || typeColors.BLOCKER)}
                    >
                      {blocker.type.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      in {blocker.workflow.name}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm font-medium text-[hsl(var(--foreground))] line-clamp-2">
                    {blocker.description}
                  </p>

                  {/* Task info */}
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    Task: {blocker.task.name} • {formatDate(blocker.createdAt)}
                  </p>

                  {/* Resolution attempt */}
                  {blocker.resolution && (
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] italic">
                      Attempted: {blocker.resolution}
                    </p>
                  )}
                </div>

                {/* Link to workflow */}
                <Link href={`/workflow/${blocker.workflow.id}`}>
                  <Button variant="ghost" size="icon-sm" className="shrink-0">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Show more if more than 5 */}
      {blockers.length > 5 && (
        <div className="p-3 border-t border-amber-200 dark:border-amber-800 text-center">
          <span className="text-sm text-amber-600 dark:text-amber-400">
            +{blockers.length - 5} more blocker{blockers.length - 5 !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </Card>
  )
}
