'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Workflow, Task, Decision, Issue, Milestone } from '@prisma/client'
import { useWebSocket, EVENTS } from './useWebSocket'

type TaskWithRelations = Task & {
  decisions: Decision[]
  issues: Issue[]
  milestones: Milestone[]
  subtasks?: TaskWithRelations[]
}

type WorkflowWithTasks = Workflow & {
  tasks: TaskWithRelations[]
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
          tasks: prev.tasks.map((task) =>
            task.id === event.taskId
              ? { ...task, decisions: [...task.decisions, event.decision] }
              : task
          ),
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
          tasks: prev.tasks.map((task) =>
            task.id === event.taskId
              ? { ...task, issues: [...task.issues, event.issue] }
              : task
          ),
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
          tasks: prev.tasks.map((task) =>
            task.id === event.taskId
              ? { ...task, milestones: [...task.milestones, event.milestone] }
              : task
          ),
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

    // Subscribe to events
    on(EVENTS.TASK_CREATED, handleTaskCreated)
    on(EVENTS.TASK_UPDATED, handleTaskUpdated)
    on(EVENTS.DECISION_CREATED, handleDecisionCreated)
    on(EVENTS.ISSUE_CREATED, handleIssueCreated)
    on(EVENTS.MILESTONE_CREATED, handleMilestoneCreated)
    on(EVENTS.WORKFLOW_UPDATED, handleWorkflowUpdated)

    return () => {
      off(EVENTS.TASK_CREATED, handleTaskCreated)
      off(EVENTS.TASK_UPDATED, handleTaskUpdated)
      off(EVENTS.DECISION_CREATED, handleDecisionCreated)
      off(EVENTS.ISSUE_CREATED, handleIssueCreated)
      off(EVENTS.MILESTONE_CREATED, handleMilestoneCreated)
      off(EVENTS.WORKFLOW_UPDATED, handleWorkflowUpdated)
    }
  }, [isConnected, workflowId, on, off])

  return {
    workflow,
    isConnected,
    lastUpdate,
  }
}
