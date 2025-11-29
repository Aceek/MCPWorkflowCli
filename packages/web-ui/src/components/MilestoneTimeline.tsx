'use client'

import type { Milestone } from '@prisma/client'
import { motion } from 'framer-motion'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

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
    <div className="relative pl-6">
      {/* Timeline line */}
      <div className="timeline-connector" />

      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const isLast = index === milestones.length - 1

          return (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="relative"
            >
              {/* Timeline dot */}
              <div
                className={cn(
                  'timeline-dot absolute -left-6',
                  isLast && 'active'
                )}
              />

              {/* Content */}
              <div className="pb-1">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-[hsl(var(--foreground))]">
                    {milestone.message}
                  </p>
                  <span className="shrink-0 text-xs text-[hsl(var(--muted-foreground))]">
                    {formatTime(milestone.createdAt)}
                  </span>
                </div>

                {milestone.progress !== null && (
                  <div className="mt-2">
                    <Progress
                      value={milestone.progress}
                      max={100}
                      showLabel
                      variant="gradient"
                      size="sm"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
