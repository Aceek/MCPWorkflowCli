'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

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
    <div className="flex flex-wrap gap-2 p-1 rounded-[var(--radius-lg)] bg-[hsl(var(--muted))]">
      {statuses.map((status) => (
        <button
          key={status.value}
          onClick={() => handleStatusChange(status.value)}
          className={cn(
            'relative rounded-[var(--radius)] px-4 py-1.5 text-sm font-medium transition-colors duration-[var(--transition-base)]',
            currentStatus === status.value
              ? 'text-[hsl(var(--primary-foreground))]'
              : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          )}
        >
          {currentStatus === status.value && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 rounded-[var(--radius)] bg-[hsl(var(--primary))] shadow-[var(--shadow-sm)]"
              transition={{
                type: 'spring',
                bounce: 0.2,
                duration: 0.6,
              }}
            />
          )}
          <span className="relative z-10">{status.label}</span>
        </button>
      ))}
    </div>
  )
}
