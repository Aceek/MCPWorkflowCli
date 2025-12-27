'use client'

import { Bot, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AgentBadgeProps {
  agentName: string | null
  callerType?: string | null
  className?: string
}

export function AgentBadge({ agentName, callerType, className }: AgentBadgeProps) {
  if (!agentName) return null

  const isOrchestrator = callerType === 'ORCHESTRATOR'

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-normal gap-1',
        isOrchestrator
          ? 'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-950 dark:text-purple-300'
          : 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300',
        className
      )}
    >
      {isOrchestrator ? (
        <User className="h-3 w-3" />
      ) : (
        <Bot className="h-3 w-3" />
      )}
      {agentName}
    </Badge>
  )
}
