import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]',
        secondary:
          'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]',
        destructive:
          'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]',
        outline:
          'border border-[hsl(var(--border))] text-[hsl(var(--foreground))]',
        success:
          'bg-[hsl(var(--success-muted))] text-[hsl(var(--success))]',
        warning:
          'bg-[hsl(var(--warning-muted))] text-[hsl(var(--warning))]',
        info:
          'bg-[hsl(var(--info-muted))] text-[hsl(var(--info))]',
        // Status-specific variants
        'in-progress':
          'bg-[hsl(var(--info-muted))] text-[hsl(var(--info))] border border-[hsl(var(--info)/0.3)]',
        completed:
          'bg-[hsl(var(--success-muted))] text-[hsl(var(--success))] border border-[hsl(var(--success)/0.3)]',
        failed:
          'bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))] border border-[hsl(var(--destructive)/0.3)]',
        'partial-success':
          'bg-[hsl(var(--warning-muted))] text-[hsl(var(--warning))] border border-[hsl(var(--warning)/0.3)]',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-[0.65rem]',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
}

function Badge({ className, variant, size, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
