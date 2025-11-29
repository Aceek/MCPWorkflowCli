import * as React from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

function EmptyState({
  className,
  icon,
  title,
  description,
  action,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] p-8 text-center animate-fade-in',
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 rounded-[var(--radius-xl)] bg-[hsl(var(--muted))] p-3 text-[hsl(var(--muted-foreground))]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-[hsl(var(--muted-foreground))]">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export { EmptyState }
