import type { Issue } from '@prisma/client'

interface IssueCardProps {
  issue: Issue
}

const typeLabels: Record<string, { label: string; emoji: string }> = {
  DOC_GAP: { label: 'Documentation Gap', emoji: '📄' },
  BUG: { label: 'Bug Encountered', emoji: '🐛' },
  DEPENDENCY_CONFLICT: { label: 'Dependency Conflict', emoji: '⚡' },
  UNCLEAR_REQUIREMENT: { label: 'Unclear Requirement', emoji: '❓' },
  OTHER: { label: 'Other', emoji: '⚠️' },
}

export function IssueCard({ issue }: IssueCardProps) {
  const issueType = typeLabels[issue.type] ?? typeLabels.OTHER!

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/30">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span>{issueType.emoji}</span>
          <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
            {issueType.label}
          </span>
        </div>
        {issue.requiresHumanReview && (
          <span className="rounded bg-red-200 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-800 dark:text-red-200">
            Needs Review
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-gray-900 dark:text-white">
        {issue.description}
      </p>

      <div className="mt-2 rounded bg-green-100 p-2 dark:bg-green-900/30">
        <p className="text-xs font-medium text-green-700 dark:text-green-300">
          Resolution:
        </p>
        <p className="text-sm text-green-800 dark:text-green-200">
          {issue.resolution}
        </p>
      </div>
    </div>
  )
}
