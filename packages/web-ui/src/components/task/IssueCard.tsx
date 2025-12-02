'use client'

import type { Issue } from '@prisma/client'
import { motion } from 'framer-motion'
import {
  FileQuestion,
  Bug,
  Zap,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Eye,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface IssueCardProps {
  issue: Issue
}

const typeConfig: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  DOC_GAP: {
    label: 'Documentation Gap',
    icon: <FileQuestion className="h-3.5 w-3.5" />,
    color: 'text-[hsl(var(--info))]',
  },
  BUG: {
    label: 'Bug Encountered',
    icon: <Bug className="h-3.5 w-3.5" />,
    color: 'text-[hsl(var(--destructive))]',
  },
  DEPENDENCY_CONFLICT: {
    label: 'Dependency Conflict',
    icon: <Zap className="h-3.5 w-3.5" />,
    color: 'text-[hsl(var(--warning))]',
  },
  UNCLEAR_REQUIREMENT: {
    label: 'Unclear Requirement',
    icon: <HelpCircle className="h-3.5 w-3.5" />,
    color: 'text-[hsl(var(--muted-foreground))]',
  },
  OTHER: {
    label: 'Other',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    color: 'text-[hsl(var(--muted-foreground))]',
  },
}

export function IssueCard({ issue }: IssueCardProps) {
  const issueType = typeConfig[issue.type] ?? typeConfig.OTHER!

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--radius-lg)] border border-[hsl(var(--warning)/0.2)] bg-[hsl(var(--warning)/0.05)] p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={issueType!.color}>{issueType!.icon}</span>
          <span className={cn('text-xs font-medium', issueType!.color)}>
            {issueType!.label}
          </span>
        </div>
        {issue.requiresHumanReview && (
          <Badge variant="destructive" size="sm" icon={<Eye className="h-3 w-3" />}>
            Needs Review
          </Badge>
        )}
      </div>

      {/* Description */}
      <p className="mt-2 text-sm text-[hsl(var(--foreground))]">
        {issue.description}
      </p>

      {/* Resolution */}
      <div className="mt-3 rounded-[var(--radius)] bg-[hsl(var(--success)/0.1)] p-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--success))]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Resolution
        </div>
        <p className="mt-1 text-sm text-[hsl(var(--success)/0.9)]">
          {issue.resolution}
        </p>
      </div>
    </motion.div>
  )
}
