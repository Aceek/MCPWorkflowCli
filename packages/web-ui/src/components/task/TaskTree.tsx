'use client'

import type { Task, Decision, Issue, Milestone } from '@prisma/client'
import { motion } from 'framer-motion'
import { TaskCard } from './TaskCard'
import { cn } from '@/lib/utils'

type TaskWithRelations = Task & {
  decisions: Decision[]
  issues: Issue[]
  milestones: Milestone[]
  subtasks?: TaskWithRelations[]
}

interface TaskTreeProps {
  task: TaskWithRelations
  allTasks: TaskWithRelations[]
  formatDuration: (ms: number | null) => string
  depth?: number
}

export function TaskTree({
  task,
  allTasks,
  formatDuration,
  depth = 0,
}: TaskTreeProps) {
  // Find subtasks for this task
  const subtasks = allTasks.filter((t) => t.parentTaskId === task.id)

  return (
    <motion.div
      initial={{ opacity: 0, x: depth > 0 ? -10 : 0 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: depth * 0.1 }}
      className={cn(
        depth > 0 && 'ml-6 pl-4 border-l-2 border-[hsl(var(--border))]'
      )}
    >
      {/* Connector dot for subtasks */}
      {depth > 0 && (
        <div className="absolute -left-[9px] top-6 h-3 w-3 rounded-full bg-[hsl(var(--background))] border-2 border-[hsl(var(--border))]" />
      )}

      <TaskCard
        task={task}
        formatDuration={formatDuration}
        isSubtask={depth > 0}
      />

      {/* Render subtasks recursively */}
      {subtasks.length > 0 && (
        <div className="mt-3 space-y-3 relative">
          {subtasks.map((subtask, index) => (
            <TaskTree
              key={subtask.id}
              task={subtask}
              allTasks={allTasks}
              formatDuration={formatDuration}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}
