import type { Milestone } from '@prisma/client'

interface MilestoneTimelineProps {
  milestones: Milestone[]
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

export function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  return (
    <div className="relative">
      <div className="absolute left-2 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-700" />

      <div className="space-y-3">
        {milestones.map((milestone, index) => (
          <div key={milestone.id} className="relative flex items-start gap-3">
            {/* Timeline dot */}
            <div
              className={`relative z-10 mt-1.5 h-4 w-4 rounded-full border-2 ${
                index === milestones.length - 1
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
              }`}
            />

            {/* Content */}
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-900 dark:text-white">
                  {milestone.message}
                </p>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(milestone.createdAt)}
                </span>
              </div>

              {milestone.progress !== null && (
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-1.5 rounded-full bg-blue-500"
                      style={{ width: `${milestone.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {milestone.progress}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
