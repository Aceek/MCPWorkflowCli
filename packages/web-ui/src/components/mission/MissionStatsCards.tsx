'use client'

import { motion } from 'framer-motion'
import { Target, Play, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface MissionStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  failed: number
  blocked: number
}

interface MissionStatsCardsProps {
  stats: MissionStats
}

const statConfig = [
  {
    key: 'total',
    label: 'Total Missions',
    icon: Target,
    color: 'text-[hsl(var(--foreground))]',
    bgColor: 'bg-[hsl(var(--muted))]',
  },
  {
    key: 'inProgress',
    label: 'In Progress',
    icon: Play,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950',
  },
  {
    key: 'blocked',
    label: 'Blocked',
    icon: AlertTriangle,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
  },
] as const

export function MissionStatsCards({ stats }: MissionStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statConfig.map(({ key, label, icon: Icon, color, bgColor }, index) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${bgColor}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                  {stats[key]}
                </p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {label}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
