import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { MissionDetail } from './MissionDetail'

export const dynamic = 'force-dynamic'

interface MissionPageProps {
  params: Promise<{ id: string }>
}

function LoadingFallback() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div>
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-2 h-4 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Progress skeleton */}
      <div className="p-4 border rounded-lg">
        <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700 mb-2" />
        <div className="h-2 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Timeline skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
    </div>
  )
}

export default async function MissionPage({ params }: MissionPageProps) {
  const { id } = await params

  if (!id) {
    notFound()
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <MissionDetail missionId={id} />
    </Suspense>
  )
}
