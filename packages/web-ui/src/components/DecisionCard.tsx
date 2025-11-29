import type { Decision } from '@prisma/client'

interface DecisionCardProps {
  decision: Decision
}

const categoryLabels: Record<string, { label: string; emoji: string }> = {
  ARCHITECTURE: { label: 'Architecture', emoji: '🏗️' },
  LIBRARY_CHOICE: { label: 'Library Choice', emoji: '📦' },
  TRADE_OFF: { label: 'Trade-off', emoji: '⚖️' },
  WORKAROUND: { label: 'Workaround', emoji: '🔧' },
  OTHER: { label: 'Other', emoji: '💡' },
}

export function DecisionCard({ decision }: DecisionCardProps) {
  const category = categoryLabels[decision.category] ?? categoryLabels.OTHER!

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/30">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span>{category.emoji}</span>
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
            {category.label}
          </span>
        </div>
      </div>

      <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
        {decision.question}
      </p>

      {decision.optionsConsidered.length > 0 && (
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium">Options:</span>{' '}
          {decision.optionsConsidered.join(', ')}
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <span className="rounded bg-blue-200 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-800 dark:text-blue-200">
          → {decision.chosen}
        </span>
      </div>

      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
        {decision.reasoning}
      </p>

      {decision.tradeOffs && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium">Trade-offs:</span> {decision.tradeOffs}
        </p>
      )}
    </div>
  )
}
