'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, Layers, ChevronRight, Target, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '../shared/StatusBadge'
import { formatDate } from '@/lib/date-utils'
import type { MissionWithPhases } from '@/lib/api'

interface MissionCardProps {
  mission: MissionWithPhases
  index?: number
}

export function MissionCard({ mission, index = 0 }: MissionCardProps) {
  // Calculate progress
  const completedPhases = mission.phases.filter(
    (p) => p.status === 'COMPLETED'
  ).length
  const progressPercent = mission.totalPhases > 0
    ? Math.round((completedPhases / mission.totalPhases) * 100)
    : 0

  // Check for blockers
  const hasBlockers = mission.status === 'BLOCKED'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0, 0, 0.2, 1],
      }}
    >
      <Link href={`/missions/${mission.id}`} className="block group">
        <Card
          variant="interactive"
          className="relative overflow-hidden p-6 h-full"
        >
          {/* Gradient accent on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary)/0.03)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Blocker indicator */}
          {hasBlockers && (
            <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-t-amber-500 border-l-[40px] border-l-transparent">
              <AlertTriangle className="absolute -top-[34px] right-1 h-4 w-4 text-white" />
            </div>
          )}

          <div className="relative">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors truncate">
                  {mission.name}
                </h2>
                <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">
                  {mission.objective}
                </p>
              </div>
              <StatusBadge status={mission.status} size="sm" />
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[hsl(var(--muted-foreground))]">
                  Phase {mission.currentPhase} of {mission.totalPhases}
                </span>
                <span className="font-medium">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Meta info */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[hsl(var(--muted-foreground))]">
              <span className="flex items-center gap-1.5">
                <Layers className="h-4 w-4" />
                <span>
                  {mission._count.phases} phase{mission._count.phases !== 1 ? 's' : ''}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Target className="h-4 w-4" />
                <span className="capitalize">{mission.profile.toLowerCase()}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(mission.createdAt)}</span>
              </span>
            </div>

            {/* Arrow indicator */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
              <ChevronRight className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}
