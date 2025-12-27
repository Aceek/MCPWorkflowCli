'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Layers,
  Target,
  RefreshCw,
  WifiOff,
} from 'lucide-react'
import { useRealtimeMission } from '@/hooks/useRealtimeMission'
import { PhaseTimeline, BlockerAlert } from '@/components/mission'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { formatDate, formatDuration } from '@/lib/date-utils'

interface MissionDetailProps {
  missionId: string
}

export function MissionDetail({ missionId }: MissionDetailProps) {
  const { mission, isLoading, error, refresh, isConnected, lastUpdate } =
    useRealtimeMission({ missionId })

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-[var(--radius-lg)] border border-[hsl(var(--destructive)/0.2)] bg-[hsl(var(--destructive)/0.05)] p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-xl)] bg-[hsl(var(--destructive)/0.1)]">
          <WifiOff className="h-6 w-6 text-[hsl(var(--destructive))]" />
        </div>
        <h3 className="text-lg font-semibold text-[hsl(var(--destructive))]">
          Failed to load mission
        </h3>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Please check your connection and try again.
        </p>
        <Button onClick={refresh} variant="destructive" className="mt-4">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </motion.div>
    )
  }

  if (isLoading || !mission) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="h-8 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-2 h-4 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="p-4 border rounded-lg">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700 mb-2" />
          <div className="h-2 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
      </div>
    )
  }

  // Destructure the response
  const { mission: missionData, blockers } = mission

  // Calculate progress
  const completedPhases = missionData.phases.filter(
    (p) => p.status === 'COMPLETED'
  ).length
  const progressPercent =
    missionData.totalPhases > 0
      ? Math.round((completedPhases / missionData.totalPhases) * 100)
      : 0

  // Calculate total duration
  const totalDuration = missionData.phases.reduce(
    (acc, phase) => acc + (phase.totalDurationMs || 0),
    0
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Breadcrumb */}
      <nav className="flex items-center justify-between">
        <Link
          href="/missions"
          className="group flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to missions
        </Link>

        {/* Connection status */}
        <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
          <Tooltip
            content={isConnected ? 'Real-time updates active' : 'Disconnected'}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  'absolute inline-flex h-full w-full rounded-[var(--radius-full)]',
                  isConnected
                    ? 'bg-[hsl(var(--success))] animate-ping opacity-75'
                    : 'bg-[hsl(var(--muted-foreground))]'
                )}
              />
              <span
                className={cn(
                  'relative inline-flex h-2 w-2 rounded-[var(--radius-full)]',
                  isConnected
                    ? 'bg-[hsl(var(--success))]'
                    : 'bg-[hsl(var(--muted-foreground))]'
                )}
              />
            </span>
          </Tooltip>
          <span>{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">
              {missionData.name}
            </h1>
            {missionData.objective && (
              <p className="mt-2 text-[hsl(var(--muted-foreground))] max-w-2xl">
                {missionData.objective}
              </p>
            )}
          </div>
          <StatusBadge status={missionData.status} size="lg" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Created: {formatDate(missionData.createdAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Layers className="h-4 w-4" />
            {missionData.phases.length} phase
            {missionData.phases.length !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <Target className="h-4 w-4" />
            <span className="capitalize">{missionData.profile.toLowerCase()}</span>
          </span>
          {totalDuration > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Total: {formatDuration(totalDuration)}
            </span>
          )}
        </div>
      </motion.div>

      {/* Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Mission Progress
            </h2>
            <span className="text-sm font-semibold">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
            Phase {missionData.currentPhase} of {missionData.totalPhases}
          </p>
        </Card>
      </motion.div>

      {/* Blockers Alert */}
      <AnimatePresence>
        {blockers && blockers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
          >
            <BlockerAlert blockers={blockers} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phases Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="mb-4 text-xl font-semibold text-[hsl(var(--foreground))]">
          Phases
        </h2>
        <PhaseTimeline
          phases={missionData.phases}
          currentPhase={missionData.currentPhase}
        />
      </motion.div>
    </motion.div>
  )
}
