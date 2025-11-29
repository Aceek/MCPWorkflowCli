'use client'

import type { Task, Decision, Issue, Milestone } from '@prisma/client'
import { motion } from 'framer-motion'
import {
  Clock,
  FolderOpen,
  TestTube,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { StatusBadge } from './StatusBadge'
import { DecisionCard } from './DecisionCard'
import { IssueCard } from './IssueCard'
import { FilesList } from './FilesList'
import { MilestoneTimeline } from './MilestoneTimeline'
import { cn } from '@/lib/utils'

type TaskWithRelations = Task & {
  decisions: Decision[]
  issues: Issue[]
  milestones: Milestone[]
}

interface TaskCardProps {
  task: TaskWithRelations
  formatDuration: (ms: number | null) => string
  isSubtask?: boolean
}

export function TaskCard({
  task,
  formatDuration,
  isSubtask = false,
}: TaskCardProps) {
  const hasFiles =
    task.filesAdded.length > 0 ||
    task.filesModified.length > 0 ||
    task.filesDeleted.length > 0

  const hasDetails =
    hasFiles ||
    task.decisions.length > 0 ||
    task.issues.length > 0 ||
    task.milestones.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          'overflow-hidden',
          isSubtask && 'border-[hsl(var(--border)/0.5)]'
        )}
      >
        {/* Task Header */}
        <CardHeader className="p-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[hsl(var(--foreground))] truncate">
                {task.name}
              </h3>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">
                {task.goal}
              </p>
            </div>
            <StatusBadge status={task.status} size="sm" />
          </div>

          {/* Meta info */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(task.durationMs)}
            </span>
            {task.areas.length > 0 && (
              <span className="flex items-center gap-1">
                <FolderOpen className="h-3.5 w-3.5" />
                {task.areas.join(', ')}
              </span>
            )}
            {task.testsStatus && (
              <span className="flex items-center gap-1">
                <TestTube className="h-3.5 w-3.5" />
                {task.testsStatus}
              </span>
            )}
          </div>

          {/* Scope warnings */}
          {task.warnings.length > 0 && (
            <div className="mt-3 space-y-1">
              {task.warnings.map((warning, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-[var(--radius)] bg-[hsl(var(--warning-muted))] px-2.5 py-1.5 text-xs text-[hsl(var(--warning))]"
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}
        </CardHeader>

        <Separator />

        {/* Task Body */}
        <CardContent className="p-4 space-y-4">
          {/* Summary */}
          {task.summary && (
            <div>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                Summary
              </h4>
              <p className="text-sm text-[hsl(var(--foreground)/0.9)]">
                {task.summary}
              </p>
            </div>
          )}

          {/* Achievements & Limitations */}
          {(task.achievements.length > 0 || task.limitations.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {task.achievements.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--success))]">
                    Achievements
                  </h4>
                  <ul className="space-y-1.5">
                    {task.achievements.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-[hsl(var(--foreground)/0.9)]"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[hsl(var(--success))]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {task.limitations.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--warning))]">
                    Limitations
                  </h4>
                  <ul className="space-y-1.5">
                    {task.limitations.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-[hsl(var(--foreground)/0.9)]"
                      >
                        <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-[hsl(var(--warning))]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Collapsible details */}
          {hasDetails && (
            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger className="text-sm font-medium text-[hsl(var(--primary))] hover:text-[hsl(var(--primary-hover))] transition-colors py-1">
                View details
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                {/* Files changed */}
                {hasFiles && (
                  <FilesList
                    added={task.filesAdded}
                    modified={task.filesModified}
                    deleted={task.filesDeleted}
                  />
                )}

                {/* Decisions */}
                {task.decisions.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Decisions ({task.decisions.length})
                    </h4>
                    <div className="space-y-2">
                      {task.decisions.map((decision) => (
                        <DecisionCard key={decision.id} decision={decision} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Issues */}
                {task.issues.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Issues ({task.issues.length})
                    </h4>
                    <div className="space-y-2">
                      {task.issues.map((issue) => (
                        <IssueCard key={issue.id} issue={issue} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Milestones */}
                {task.milestones.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                      Milestones ({task.milestones.length})
                    </h4>
                    <MilestoneTimeline milestones={task.milestones} />
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Manual review needed */}
          {task.manualReviewNeeded && (
            <div className="rounded-[var(--radius-lg)] bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.2)] p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--destructive))]">
                <Eye className="h-4 w-4" />
                Manual Review Required
              </div>
              {task.manualReviewReason && (
                <p className="mt-1.5 text-sm text-[hsl(var(--destructive)/0.9)]">
                  {task.manualReviewReason}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
