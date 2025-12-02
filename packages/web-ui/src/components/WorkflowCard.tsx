'use client'

import Link from 'next/link'
import type { Workflow } from '@prisma/client'
import { motion } from 'framer-motion'
import { Calendar, ListTodo, ChevronRight, Clock, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { StatusBadge } from './StatusBadge'
import { cn } from '@/lib/utils'

interface WorkflowCardProps {
  workflow: Workflow & {
    _count: {
      tasks: number
    }
  }
  index?: number
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) {
    return 'Date invalide'
  }
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

function formatDuration(ms: number | null): string {
  if (!ms) return '-'
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

function formatTokens(tokens: number | null): string {
  if (!tokens) return '-'
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`
  }
  return tokens.toString()
}

export function WorkflowCard({ workflow, index = 0 }: WorkflowCardProps) {
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
      <Link href={`/workflow/${workflow.id}`} className="block group">
        <Card
          variant="interactive"
          className="relative overflow-hidden p-6 h-full"
        >
          {/* Gradient accent on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary)/0.03)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="relative">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors truncate">
                  {workflow.name}
                </h2>
                {workflow.description && (
                  <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">
                    {workflow.description}
                  </p>
                )}
              </div>
              <StatusBadge status={workflow.status} size="sm" />
            </div>

            {/* Meta info */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[hsl(var(--muted-foreground))]">
              <span className="flex items-center gap-1.5">
                <ListTodo className="h-4 w-4" />
                <span>
                  {workflow._count.tasks} task{workflow._count.tasks !== 1 ? 's' : ''}
                </span>
              </span>
              {workflow.totalDurationMs && workflow.totalDurationMs > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(workflow.totalDurationMs)}</span>
                </span>
              )}
              {workflow.totalTokens && workflow.totalTokens > 0 && (
                <span className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4" />
                  <span>{formatTokens(workflow.totalTokens)} tokens</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(workflow.createdAt)}</span>
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
