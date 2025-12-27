'use client'

import type { Decision } from '@prisma/client'
import { motion } from 'framer-motion'
import {
  Building2,
  Package,
  Scale,
  Wrench,
  Lightbulb,
  ArrowRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { parseJsonArraySafe } from '@/lib/json-parse'
import { StringArraySchema } from '@/lib/json-schemas'

interface DecisionCardProps {
  decision: Decision
}

type CategoryConfigItem = { label: string; icon: React.ReactNode; color: string }

const defaultCategory: CategoryConfigItem = {
  label: 'Other',
  icon: <Lightbulb className="h-3.5 w-3.5" />,
  color: 'text-[hsl(var(--muted-foreground))]',
}

const categoryConfig: Record<string, CategoryConfigItem> = {
  ARCHITECTURE: {
    label: 'Architecture',
    icon: <Building2 className="h-3.5 w-3.5" />,
    color: 'text-[hsl(var(--primary))]',
  },
  LIBRARY_CHOICE: {
    label: 'Library Choice',
    icon: <Package className="h-3.5 w-3.5" />,
    color: 'text-[hsl(var(--info))]',
  },
  TRADE_OFF: {
    label: 'Trade-off',
    icon: <Scale className="h-3.5 w-3.5" />,
    color: 'text-[hsl(var(--warning))]',
  },
  WORKAROUND: {
    label: 'Workaround',
    icon: <Wrench className="h-3.5 w-3.5" />,
    color: 'text-[hsl(var(--muted-foreground))]',
  },
  OTHER: defaultCategory,
}

export function DecisionCard({ decision }: DecisionCardProps) {
  const category = categoryConfig[decision.category] ?? defaultCategory
  const optionsConsidered = parseJsonArraySafe(decision.optionsConsidered, StringArraySchema)

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--radius-lg)] border border-[hsl(var(--primary)/0.2)] bg-[hsl(var(--primary)/0.05)] p-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className={category.color}>{category.icon}</span>
        <span className={cn('text-xs font-medium', category.color)}>
          {category.label}
        </span>
      </div>

      {/* Question */}
      <p className="mt-2 font-medium text-[hsl(var(--foreground))]">
        {decision.question}
      </p>

      {/* Options considered */}
      {optionsConsidered.length > 0 && (
        <div className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
          <span className="font-medium">Options considered:</span>{' '}
          {optionsConsidered.join(', ')}
        </div>
      )}

      {/* Chosen option */}
      <div className="mt-3 flex items-center gap-2">
        <ArrowRight className="h-4 w-4 text-[hsl(var(--primary))]" />
        <Badge variant="info" size="sm">
          {decision.chosen}
        </Badge>
      </div>

      {/* Reasoning */}
      <p className="mt-3 text-sm text-[hsl(var(--foreground)/0.85)]">
        {decision.reasoning}
      </p>

      {/* Trade-offs */}
      {decision.tradeOffs && (
        <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
          <span className="font-medium">Trade-offs:</span> {decision.tradeOffs}
        </p>
      )}
    </motion.div>
  )
}
