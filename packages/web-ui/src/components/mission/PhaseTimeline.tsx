'use client'

import { PhaseCard } from './PhaseCard'
import type { PhaseWithStats } from '@/lib/api'

interface PhaseTimelineProps {
  phases: PhaseWithStats[]
  currentPhase: number
}

export function PhaseTimeline({ phases, currentPhase }: PhaseTimelineProps) {
  if (phases.length === 0) {
    return (
      <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
        No phases yet
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Vertical line connecting phases */}
      <div className="absolute left-[23px] top-8 bottom-8 w-0.5 bg-[hsl(var(--border))]" />

      <div className="space-y-4">
        {phases.map((phase) => (
          <div key={phase.id} className="relative">
            {/* Connection dot */}
            <div className="absolute left-5 top-7 w-2 h-2 rounded-full bg-[hsl(var(--border))] z-10" />

            <div className="pl-12">
              <PhaseCard
                phase={phase}
                isActive={phase.number === currentPhase}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
