'use client'

import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Wifi, WifiOff, Target } from 'lucide-react'
import { useRealtimeMissions } from '@/hooks/useRealtimeMissions'
import { MissionCard } from './MissionCard'
import { MissionStatsCards } from './MissionStatsCards'
import { MissionStatusFilter } from './MissionStatusFilter'
import { WorkflowCardSkeleton, StatsSkeleton } from '../shared'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

function formatLastUpdate(date: Date | null): string {
  if (!date) return ''
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 5) return 'Just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return date.toLocaleTimeString()
}

export function RealtimeMissionList() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status') || undefined

  const {
    missions,
    stats,
    isLoading,
    error,
    lastUpdate,
    refresh,
    isConnected,
  } = useRealtimeMissions({
    status,
  })

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
          Failed to load missions
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

  return (
    <div className="space-y-6">
      {/* Header with real-time indicator */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">
            Missions
          </h2>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            Multi-agent workflow orchestration
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3"
        >
          {/* Connection status */}
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <Tooltip
              content={
                isConnected ? 'Real-time updates active' : 'Disconnected'
              }
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
                      : isLoading
                        ? 'bg-[hsl(var(--warning))] animate-pulse'
                        : 'bg-[hsl(var(--muted-foreground))]'
                  )}
                />
              </span>
            </Tooltip>
            <span>
              {isConnected
                ? `Live${lastUpdate ? ` • ${formatLastUpdate(lastUpdate)}` : ''}`
                : isLoading
                  ? 'Connecting...'
                  : 'Offline'}
            </span>
          </div>

          {/* Refresh button */}
          <Tooltip content="Refresh">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={refresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn('h-4 w-4', isLoading && 'animate-spin')}
              />
            </Button>
          </Tooltip>
        </motion.div>
      </div>

      {/* Stats */}
      <AnimatePresence mode="wait">
        {isLoading && stats.total === 0 ? (
          <motion.div
            key="stats-skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <StatsSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MissionStatsCards stats={stats} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters and count */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <MissionStatusFilter />
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {missions.length} mission{missions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Mission Grid */}
      <AnimatePresence mode="wait">
        {isLoading && missions.length === 0 ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <WorkflowCardSkeleton key={i} />
            ))}
          </motion.div>
        ) : missions.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <EmptyState
              icon={<Target className="h-8 w-8" />}
              title={
                status && status !== 'all'
                  ? 'No missions with this status'
                  : 'No missions yet'
              }
              description={
                status && status !== 'all'
                  ? 'Try changing the filter or create a new mission.'
                  : 'Create a mission using the MCP tools to see it here.'
              }
            />
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {missions.map((mission, index) => (
              <MissionCard key={mission.id} mission={mission} index={index} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
