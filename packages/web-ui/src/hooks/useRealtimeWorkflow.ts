'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Workflow, Task, Decision, Issue, Milestone, Phase } from '@prisma/client'
import { useWebSocket, EVENTS } from './useWebSocket'
import type { PhaseWithStats } from '@/lib/api'

type TaskWithRelations = Task & {
  decisions: Decision[]
  issues: Issue[]
  milestones: Milestone[]
  subtasks?: TaskWithRelations[]
}

type WorkflowWithTasks = Workflow & {
  tasks: TaskWithRelations[]
  phases?: PhaseWithStats[]
}

interface TaskCreatedEvent {
  task: Task
  workflowId: string
}

interface TaskUpdatedEvent {
  task: Task
  workflowId: string
}

interface DecisionCreatedEvent {
  decision: Decision
  taskId: string
  workflowId: string
}

interface IssueCreatedEvent {
  issue: Issue
  taskId: string
  workflowId: string
}

interface MilestoneCreatedEvent {
  milestone: Milestone
  taskId: string
  workflowId: string
}

interface WorkflowUpdatedEvent {
  workflow: Workflow
}

interface PhaseCreatedEvent {
  phase: Phase
  workflowId: string
}

interface PhaseUpdatedEvent {
  phase: Phase
  workflowId: string
}

interface UseRealtimeWorkflowOptions {
  workflowId: string
  initialData: WorkflowWithTasks | null
}

/**
 * Hook for real-time workflow detail updates via WebSocket.
 *
 * Subscribes to the workflow-specific room and updates tasks,
 * decisions, issues, and milestones in real-time.
 */
export function useRealtimeWorkflow(options: UseRealtimeWorkflowOptions) {
  const { workflowId, initialData } = options

  const [workflow, setWorkflow] = useState<WorkflowWithTasks | null>(initialData)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // WebSocket connection with workflow subscription
  const { isConnected, on, off } = useWebSocket({
    autoConnect: true,
    workflowId,
  })

  // Sync with initial data when it changes
  useEffect(() => {
    if (initialData) {
      setWorkflow(initialData)
    }
  }, [initialData])

  // Handle WebSocket events
  useEffect(() => {
    if (!isConnected || !workflowId) return

    // Task created
    const handleTaskCreated = (event: TaskCreatedEvent) => {
      if (event.workflowId !== workflowId) return

      setWorkflow((prev) => {
        if (!prev) return prev
        // Check if task already exists (avoid duplicates from SSR + WebSocket race)
        if (prev.tasks.some((t) => t.id === event.task.id)) {
          return prev
        }
        // Add new task with empty relations
        const newTask: TaskWithRelations = {
          ...event.task,
          decisions: [],
          issues: [],
          milestones: [],
          subtasks: [],
        }
        return {
          ...prev,
          tasks: [...prev.tasks, newTask],
        }
      })
      setLastUpdate(new Date())
    }

    // Task updated
    const handleTaskUpdated = (event: TaskUpdatedEvent) => {
      if (event.workflowId !== workflowId) return

      setWorkflow((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          tasks: prev.tasks.map((task) =>
            task.id === event.task.id ? { ...task, ...event.task } : task
          ),
        }
      })
      setLastUpdate(new Date())
    }

    // Decision created
    const handleDecisionCreated = (event: DecisionCreatedEvent) => {
      if (event.workflowId !== workflowId) return

      setWorkflow((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          tasks: prev.tasks.map((task) => {
            if (task.id !== event.taskId) return task
            // Check if decision already exists
            if (task.decisions.some((d) => d.id === event.decision.id)) {
              return task
            }
            return { ...task, decisions: [...task.decisions, event.decision] }
          }),
        }
      })
      setLastUpdate(new Date())
    }

    // Issue created
    const handleIssueCreated = (event: IssueCreatedEvent) => {
      if (event.workflowId !== workflowId) return

      setWorkflow((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          tasks: prev.tasks.map((task) => {
            if (task.id !== event.taskId) return task
            // Check if issue already exists
            if (task.issues.some((i) => i.id === event.issue.id)) {
              return task
            }
            return { ...task, issues: [...task.issues, event.issue] }
          }),
        }
      })
      setLastUpdate(new Date())
    }

    // Milestone created
    const handleMilestoneCreated = (event: MilestoneCreatedEvent) => {
      if (event.workflowId !== workflowId) return

      setWorkflow((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          tasks: prev.tasks.map((task) => {
            if (task.id !== event.taskId) return task
            // Check if milestone already exists
            if (task.milestones.some((m) => m.id === event.milestone.id)) {
              return task
            }
            return { ...task, milestones: [...task.milestones, event.milestone] }
          }),
        }
      })
      setLastUpdate(new Date())
    }

    // Workflow updated (e.g., status change)
    const handleWorkflowUpdated = (event: WorkflowUpdatedEvent) => {
      if (event.workflow.id !== workflowId) return

      setWorkflow((prev) => {
        if (!prev) return prev
        return { ...prev, ...event.workflow }
      })
      setLastUpdate(new Date())
    }

    // Phase created
    const handlePhaseCreated = (event: PhaseCreatedEvent) => {
      if (event.workflowId !== workflowId) return

      setWorkflow((prev) => {
        if (!prev) return prev
        // Check if phase already exists
        if (prev.phases?.some((p) => p.id === event.phase.id)) {
          return prev
        }
        // Add new phase with default stats
        const newPhase: PhaseWithStats = {
          ...event.phase,
          _count: { tasks: 0 },
          tasksCount: 0,
          completedTasksCount: 0,
          totalDurationMs: 0,
          tasks: [],
        }
        return {
          ...prev,
          phases: [...(prev.phases || []), newPhase],
        }
      })
      setLastUpdate(new Date())
    }

    // Phase updated
    const handlePhaseUpdated = (event: PhaseUpdatedEvent) => {
      if (event.workflowId !== workflowId) return

      setWorkflow((prev) => {
        if (!prev || !prev.phases) return prev
        return {
          ...prev,
          phases: prev.phases.map((phase) =>
            phase.id === event.phase.id
              ? { ...phase, ...event.phase }
              : phase
          ),
        }
      })
      setLastUpdate(new Date())
    }

    // Subscribe to events
    on(EVENTS.TASK_CREATED, handleTaskCreated)
    on(EVENTS.TASK_UPDATED, handleTaskUpdated)
    on(EVENTS.DECISION_CREATED, handleDecisionCreated)
    on(EVENTS.ISSUE_CREATED, handleIssueCreated)
    on(EVENTS.MILESTONE_CREATED, handleMilestoneCreated)
    on(EVENTS.WORKFLOW_UPDATED, handleWorkflowUpdated)
    on(EVENTS.PHASE_CREATED, handlePhaseCreated)
    on(EVENTS.PHASE_UPDATED, handlePhaseUpdated)

    return () => {
      off(EVENTS.TASK_CREATED, handleTaskCreated)
      off(EVENTS.TASK_UPDATED, handleTaskUpdated)
      off(EVENTS.DECISION_CREATED, handleDecisionCreated)
      off(EVENTS.ISSUE_CREATED, handleIssueCreated)
      off(EVENTS.MILESTONE_CREATED, handleMilestoneCreated)
      off(EVENTS.WORKFLOW_UPDATED, handleWorkflowUpdated)
      off(EVENTS.PHASE_CREATED, handlePhaseCreated)
      off(EVENTS.PHASE_UPDATED, handlePhaseUpdated)
    }
  }, [isConnected, workflowId, on, off])

  return {
    workflow,
    isConnected,
    lastUpdate,
  }
}
