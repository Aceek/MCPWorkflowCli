'use client'

import { Skeleton as BaseSkeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export function WorkflowCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <BaseSkeleton className="h-6 w-48" />
          <BaseSkeleton className="h-4 w-72" />
        </div>
        <BaseSkeleton className="h-6 w-24 rounded-[var(--radius-full)]" />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <BaseSkeleton className="h-4 w-20" />
        <BaseSkeleton className="h-4 w-32" />
      </div>
    </Card>
  )
}

export function WorkflowDetailSkeleton() {
  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <BaseSkeleton className="mb-6 h-4 w-32" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <BaseSkeleton className="h-9 w-64" />
            <BaseSkeleton className="h-5 w-96" />
          </div>
          <BaseSkeleton className="h-6 w-24 rounded-[var(--radius-full)]" />
        </div>
        <div className="mt-4 flex items-center gap-6">
          <BaseSkeleton className="h-4 w-40" />
          <BaseSkeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Tasks */}
      <div>
        <BaseSkeleton className="mb-4 h-7 w-20" />
        <div className="space-y-4">
          <TaskCardSkeleton />
          <TaskCardSkeleton />
        </div>
      </div>
    </div>
  )
}

export function TaskCardSkeleton() {
  return (
    <Card>
      <div className="p-4 pb-3 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <BaseSkeleton className="h-5 w-40" />
            <BaseSkeleton className="h-4 w-64" />
          </div>
          <BaseSkeleton className="h-6 w-20 rounded-[var(--radius-full)]" />
        </div>
        <div className="flex items-center gap-4">
          <BaseSkeleton className="h-3 w-20" />
          <BaseSkeleton className="h-3 w-28" />
        </div>
      </div>
      <Separator />
      <div className="p-4 space-y-2">
        <BaseSkeleton className="h-3 w-16" />
        <BaseSkeleton className="h-4 w-full" />
        <BaseSkeleton className="h-4 w-3/4" />
      </div>
    </Card>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center gap-4">
            <BaseSkeleton className="h-10 w-10 rounded-[var(--radius-lg)]" />
            <div className="space-y-2">
              <BaseSkeleton className="h-4 w-24" />
              <BaseSkeleton className="h-7 w-12" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// Re-export the base Skeleton for direct use
export { BaseSkeleton as Skeleton }
