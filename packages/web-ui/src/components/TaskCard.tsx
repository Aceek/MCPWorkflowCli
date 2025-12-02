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
  Zap,
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
import { parseJsonArray } from '@/lib/json-parse'
import { formatTokens } from '@/lib/format-utils'

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
  // Parse JSON arrays (SQLite stores arrays as JSON strings)
  const areas = parseJsonArray(task.areas)
  const warnings = parseJsonArray(task.warnings)
  const filesAdded = parseJsonArray(task.filesAdded)
  const filesModified = parseJsonArray(task.filesModified)
  const filesDeleted = parseJsonArray(task.filesDeleted)
  const achievements = parseJsonArray(task.achievements)
  const limitations = parseJsonArray(task.limitations)

  const hasFiles =
    filesAdded.length > 0 ||
    filesModified.length > 0 ||
    filesDeleted.length > 0

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
            {areas.length > 0 && (
              <span className="flex items-center gap-1">
                <FolderOpen className="h-3.5 w-3.5" />
                {areas.join(', ')}
              </span>
            )}
            {task.testsStatus && (
              <span className="flex items-center gap-1">
                <TestTube className="h-3.5 w-3.5" />
                {task.testsStatus}
              </span>
            )}
            {(task.tokensInput || task.tokensOutput) && (
              <span className="flex items-center gap-1">
                <Zap className="h-3.5 w-3.5" />
                {formatTokens((task.tokensInput || 0) + (task.tokensOutput || 0))}
              </span>
            )}
          </div>

          {/* Scope warnings */}
          {warnings.length > 0 && (
            <div className="mt-3 space-y-1">
              {warnings.map((warning, idx) => (
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
          {(achievements.length > 0 || limitations.length > 0) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {achievements.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--success))]">
                    Achievements
                  </h4>
                  <ul className="space-y-1.5">
                    {achievements.map((item, idx) => (
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

              {limitations.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--warning))]">
                    Limitations
                  </h4>
                  <ul className="space-y-1.5">
                    {limitations.map((item, idx) => (
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
                    added={filesAdded}
                    modified={filesModified}
                    deleted={filesDeleted}
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
