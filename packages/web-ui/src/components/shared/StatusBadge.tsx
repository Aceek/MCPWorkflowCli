'use client'

import { Badge, type BadgeProps } from '@/components/ui/badge'
import {
  Circle,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Status string constants (SQLite stores enums as strings)
type KnownStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED' | 'BLOCKED'

interface StatusBadgeProps {
  status: string  // Accept any string from DB, handle unknown gracefully
  size?: 'sm' | 'default' | 'lg'
  showIcon?: boolean
  animated?: boolean
}

const statusConfig: Record<
  KnownStatus,
  {
    label: string
    variant: BadgeProps['variant']
    icon: React.ReactNode
  }
> = {
  PENDING: {
    label: 'Pending',
    variant: 'secondary',
    icon: <Circle className="h-3 w-3" />,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    variant: 'in-progress',
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  COMPLETED: {
    label: 'Completed',
    variant: 'completed',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  SUCCESS: {
    label: 'Success',
    variant: 'completed',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  PARTIAL_SUCCESS: {
    label: 'Partial',
    variant: 'partial-success',
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  FAILED: {
    label: 'Failed',
    variant: 'failed',
    icon: <XCircle className="h-3 w-3" />,
  },
  BLOCKED: {
    label: 'Blocked',
    variant: 'destructive',
    icon: <AlertTriangle className="h-3 w-3" />,
  },
}

export function StatusBadge({
  status,
  size = 'default',
  showIcon = true,
  animated = true,
}: StatusBadgeProps) {
  const config = statusConfig[status as KnownStatus] ?? statusConfig.IN_PROGRESS

  return (
    <Badge
      variant={config.variant}
      size={size}
      icon={showIcon ? config.icon : undefined}
      className={cn(
        animated && status === 'IN_PROGRESS' && 'animate-pulse'
      )}
    >
      {config.label}
    </Badge>
  )
}
