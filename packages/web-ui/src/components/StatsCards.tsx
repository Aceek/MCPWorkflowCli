import type { WorkflowStatus } from '@prisma/client'

interface StatsCardsProps {
  stats: {
    total: number
    inProgress: number
    completed: number
    failed: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: 'Total Workflows',
      value: stats.total,
      color: 'text-gray-900 dark:text-white',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      label: 'Completed',
      value: stats.completed,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
    },
    {
      label: 'Failed',
      value: stats.failed,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/30',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-lg border border-gray-200 p-4 dark:border-gray-700 ${card.bgColor}`}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {card.label}
          </p>
          <p className={`mt-1 text-3xl font-bold ${card.color}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
