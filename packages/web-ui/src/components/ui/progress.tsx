'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  showLabel?: boolean
  variant?: 'default' | 'gradient' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'default' | 'lg'
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      showLabel = false,
      variant = 'default',
      size = 'default',
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    const sizeStyles = {
      sm: 'h-1',
      default: 'h-2',
      lg: 'h-3',
    }

    const variantStyles = {
      default: 'bg-[hsl(var(--primary))]',
      gradient: 'bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--info))]',
      success: 'bg-[hsl(var(--success))]',
      warning: 'bg-[hsl(var(--warning))]',
      error: 'bg-[hsl(var(--destructive))]',
    }

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div
          ref={ref}
          className={cn(
            'relative w-full overflow-hidden rounded-[var(--radius-full)] bg-[hsl(var(--muted))]',
            sizeStyles[size]
          )}
          {...props}
        >
          <motion.div
            className={cn(
              'h-full rounded-[var(--radius-full)]',
              variantStyles[variant]
            )}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
          />
        </div>
        {showLabel && (
          <span className="min-w-[3ch] text-xs font-medium text-[hsl(var(--muted-foreground))]">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    )
  }
)
Progress.displayName = 'Progress'

export { Progress }
