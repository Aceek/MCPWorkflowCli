interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`}
    />
  )
}

export function WorkflowCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  )
}

export function WorkflowDetailSkeleton() {
  return (
    <div>
      {/* Breadcrumb */}
      <Skeleton className="mb-6 h-4 w-32" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <Skeleton className="h-9 w-64" />
            <Skeleton className="mt-2 h-5 w-96" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="mt-4 flex items-center gap-6">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Tasks */}
      <div>
        <Skeleton className="mb-4 h-7 w-20" />
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
    <div className="rounded-lg border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="mt-3 flex items-center gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="p-4">
        <Skeleton className="mb-2 h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-3/4" />
      </div>
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-8 w-16" />
        </div>
      ))}
    </div>
  )
}
