'use client'

import { AlertTriangle, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/date-utils'
import type { Issue } from '@prisma/client'
import Link from 'next/link'

interface BlockerAlertProps {
  blockers: (Issue & {
    task: {
      id: string
      name: string
      phaseId: string | null
    }
  })[]
  workflowId: string
}

export function BlockerAlert({ blockers, workflowId }: BlockerAlertProps) {
  if (blockers.length === 0) return null

  return (
    <Card className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/50">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <h3 className="font-semibold text-amber-800 dark:text-amber-200">
            {blockers.length} Blocker{blockers.length !== 1 ? 's' : ''} Requiring Attention
          </h3>
        </div>

        <div className="space-y-3">
          {blockers.map((blocker) => (
            <div
              key={blocker.id}
              className="p-3 rounded-lg bg-white/50 dark:bg-black/20 border border-amber-200 dark:border-amber-800"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700">
                      {blocker.type}
                    </Badge>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {formatDate(blocker.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                    {blocker.description}
                  </p>
                  {blocker.resolution && (
                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                      Attempted: {blocker.resolution}
                    </p>
                  )}
                </div>
                <Link
                  href={`/workflow/${workflowId}`}
                  className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                From task: {blocker.task.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
