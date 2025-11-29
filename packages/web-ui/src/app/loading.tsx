import { WorkflowCardSkeleton, StatsSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-1 h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="mb-8">
        <StatsSkeleton />
      </div>

      {/* Workflow cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <WorkflowCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
