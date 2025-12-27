'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const statuses = [
  { value: 'all', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'PAUSED', label: 'Paused' },
]

export function MissionStatusFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get('status') || 'all'

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status === 'all') {
      params.delete('status')
    } else {
      params.set('status', status)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => {
        const isActive = currentStatus === status.value
        return (
          <button
            key={status.value}
            onClick={() => handleStatusChange(status.value)}
            className={cn(
              'relative px-4 py-2 text-sm font-medium rounded-full transition-colors',
              isActive
                ? 'text-[hsl(var(--primary-foreground))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="mission-status-filter-active"
                className="absolute inset-0 bg-[hsl(var(--primary))] rounded-full"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">{status.label}</span>
          </button>
        )
      })}
    </div>
  )
}
