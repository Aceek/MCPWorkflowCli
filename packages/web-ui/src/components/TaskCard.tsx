import type { Task, Decision, Issue, Milestone } from '@prisma/client'
import { StatusBadge } from './StatusBadge'
import { DecisionCard } from './DecisionCard'
import { IssueCard } from './IssueCard'
import { FilesList } from './FilesList'
import { MilestoneTimeline } from './MilestoneTimeline'

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

  return (
    <div
      className={`rounded-lg border bg-white dark:bg-gray-800 ${
        isSubtask
          ? 'border-gray-200 dark:border-gray-700'
          : 'border-gray-300 dark:border-gray-600'
      }`}
    >
      {/* Task Header */}
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {task.name}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {task.goal}
            </p>
          </div>
          <StatusBadge status={task.status} />
        </div>

        {/* Meta info */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>Duration: {formatDuration(task.durationMs)}</span>
          {task.areas.length > 0 && (
            <span>Areas: {task.areas.join(', ')}</span>
          )}
          {task.testsStatus && <span>Tests: {task.testsStatus}</span>}
        </div>

        {/* Scope warnings */}
        {task.warnings.length > 0 && (
          <div className="mt-3">
            {task.warnings.map((warning, idx) => (
              <div
                key={idx}
                className="rounded bg-yellow-50 px-2 py-1 text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
              >
                ⚠️ {warning}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Body */}
      <div className="p-4">
        {/* Summary */}
        {task.summary && (
          <div className="mb-4">
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Summary
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {task.summary}
            </p>
          </div>
        )}

        {/* Achievements & Limitations */}
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          {task.achievements.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400">
                Achievements
              </h4>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {task.achievements.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {task.limitations.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">
                Limitations
              </h4>
              <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {task.limitations.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-orange-500">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Files changed */}
        {hasFiles && (
          <div className="mb-4">
            <FilesList
              added={task.filesAdded}
              modified={task.filesModified}
              deleted={task.filesDeleted}
            />
          </div>
        )}

        {/* Decisions */}
        {task.decisions.length > 0 && (
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
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
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
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
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Milestones ({task.milestones.length})
            </h4>
            <MilestoneTimeline milestones={task.milestones} />
          </div>
        )}

        {/* Manual review needed */}
        {task.manualReviewNeeded && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/30">
            <div className="flex items-center gap-2 text-sm font-medium text-red-800 dark:text-red-200">
              🔍 Manual Review Required
            </div>
            {task.manualReviewReason && (
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {task.manualReviewReason}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
