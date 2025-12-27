'use client'

import { motion } from 'framer-motion'
import {
  LayoutGrid,
  Circle,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { AnimatedCounter } from '@/components/ui/motion'
import { cn } from '@/lib/utils'

interface StatsCardsProps {
  stats: {
    total: number
    pending: number
    inProgress: number
    completed: number
    failed: number
    blocked: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: 'Total Workflows',
      value: stats.total,
      icon: LayoutGrid,
      color: 'text-[hsl(var(--foreground))]',
      iconBg: 'bg-[hsl(var(--muted))]',
      iconColor: 'text-[hsl(var(--muted-foreground))]',
    },
    {
      label: 'In Progress',
      value: stats.inProgress,
      icon: Loader2,
      color: 'text-[hsl(var(--info))]',
      iconBg: 'bg-[hsl(var(--info-muted))]',
      iconColor: 'text-[hsl(var(--info))]',
      animate: true,
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'text-[hsl(var(--success))]',
      iconBg: 'bg-[hsl(var(--success-muted))]',
      iconColor: 'text-[hsl(var(--success))]',
    },
    {
      label: 'Blocked',
      value: stats.blocked,
      icon: AlertTriangle,
      color: 'text-amber-500',
      iconBg: 'bg-amber-50 dark:bg-amber-950',
      iconColor: 'text-amber-500',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon

        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: index * 0.05,
              ease: [0, 0, 0.2, 1],
            }}
          >
            <Card className="p-4 hover-lift">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)]',
                    card.iconBg
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      card.iconColor,
                      card.animate && 'animate-spin'
                    )}
                  />
                </div>
                <div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {card.label}
                  </p>
                  <p className={cn('text-2xl font-bold', card.color)}>
                    <AnimatedCounter value={card.value} duration={0.5} />
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
