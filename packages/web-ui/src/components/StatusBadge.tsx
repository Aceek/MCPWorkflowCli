'use client'

import type { WorkflowStatus, TaskStatus } from '@prisma/client'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Circle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Status = WorkflowStatus | TaskStatus

interface StatusBadgeProps {
  status: Status
  size?: 'sm' | 'default' | 'lg'
  showIcon?: boolean
  animated?: boolean
}

const statusConfig: Record<
  Status,
  {
    label: string
    variant: BadgeProps['variant']
    icon: React.ReactNode
  }
> = {
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
}

export function StatusBadge({
  status,
  size = 'default',
  showIcon = true,
  animated = true,
}: StatusBadgeProps) {
  const config = statusConfig[status]

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
