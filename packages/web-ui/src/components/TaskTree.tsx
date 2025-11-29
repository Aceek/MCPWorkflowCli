import type { Task, Decision, Issue, Milestone } from '@prisma/client'
import { TaskCard } from './TaskCard'

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
    <div className={depth > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4 dark:border-gray-700' : ''}>
      <TaskCard
        task={task}
        formatDuration={formatDuration}
        isSubtask={depth > 0}
      />

      {/* Render subtasks recursively */}
      {subtasks.length > 0 && (
        <div className="mt-3 space-y-3">
          {subtasks.map((subtask) => (
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
    </div>
  )
}
