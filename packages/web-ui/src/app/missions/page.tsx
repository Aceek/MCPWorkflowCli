import { Suspense } from 'react'
import { RealtimeMissionList } from '@/components/mission'
import { WorkflowCardSkeleton, StatsSkeleton } from '@/components/shared'

export const dynamic = 'force-dynamic'

function LoadingFallback() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mt-1 h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="mb-6">
        <StatsSkeleton />
      </div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-9 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <WorkflowCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export default function MissionsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RealtimeMissionList />
    </Suspense>
  )
}
