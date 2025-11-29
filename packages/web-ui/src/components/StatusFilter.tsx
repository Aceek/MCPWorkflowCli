'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { WorkflowStatus } from '@prisma/client'

const statuses: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
]

export function StatusFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get('status') || 'all'

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status === 'all') {
      params.delete('status')
    } else {
      params.set('status', status)
    }
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <button
          key={status.value}
          onClick={() => handleStatusChange(status.value)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            currentStatus === status.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          {status.label}
        </button>
      ))}
    </div>
  )
}
