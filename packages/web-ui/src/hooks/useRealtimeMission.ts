'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Mission, Phase, Task } from '@prisma/client'
import { useWebSocket, EVENTS } from './useWebSocket'
import { fetchMission, type MissionDetailResponse } from '@/lib/api'

interface MissionUpdatedEvent {
  mission: Mission
}

interface PhaseCreatedEvent {
  phase: Phase
  missionId: string
}

interface PhaseUpdatedEvent {
  phase: Phase
  missionId: string
}

interface TaskCreatedEvent {
  task: Task
  workflowId?: string
  phaseId?: string
}

interface TaskUpdatedEvent {
  task: Task
}

interface UseRealtimeMissionOptions {
  missionId: string
  enabled?: boolean
}

/**
 * Hook for real-time single mission updates via WebSocket.
 *
 * Fetches initial data via REST API, then listens for WebSocket events
 * to update the mission in real-time.
 */
export function useRealtimeMission(options: UseRealtimeMissionOptions) {
  const { missionId, enabled = true } = options

  const [mission, setMission] = useState<MissionDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // WebSocket connection
  const { isConnected, on, off } = useWebSocket({ autoConnect: enabled })

  // Fetch mission from API
  const fetchMissionData = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await fetchMission(missionId)
      setMission(data)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [missionId])

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchMissionData()
    }
  }, [fetchMissionData, enabled])

  // Handle WebSocket events
  useEffect(() => {
    if (!isConnected) return

    // Mission updated
    const handleMissionUpdated = (event: MissionUpdatedEvent) => {
      if (event.mission.id !== missionId) return

      setMission((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          mission: { ...prev.mission, ...event.mission },
        }
      })
      setLastUpdate(new Date())
    }

    // Phase created - refetch to get full data
    const handlePhaseCreated = (event: PhaseCreatedEvent) => {
      if (event.missionId !== missionId) return
      fetchMissionData()
    }

    // Phase updated - refetch to get accurate state
    const handlePhaseUpdated = (event: PhaseUpdatedEvent) => {
      if (event.missionId !== missionId) return
      fetchMissionData()
    }

    // Task created in this mission - refetch
    const handleTaskCreated = (event: TaskCreatedEvent) => {
      if (!event.phaseId) return
      // We need to check if this phase belongs to our mission
      // For simplicity, refetch if any task is created
      fetchMissionData()
    }

    // Task updated - refetch to update phase stats
    const handleTaskUpdated = () => {
      fetchMissionData()
    }

    // Subscribe to events
    on(EVENTS.MISSION_UPDATED, handleMissionUpdated)
    on(EVENTS.PHASE_CREATED, handlePhaseCreated)
    on(EVENTS.PHASE_UPDATED, handlePhaseUpdated)
    on(EVENTS.TASK_CREATED, handleTaskCreated)
    on(EVENTS.TASK_UPDATED, handleTaskUpdated)

    return () => {
      off(EVENTS.MISSION_UPDATED, handleMissionUpdated)
      off(EVENTS.PHASE_CREATED, handlePhaseCreated)
      off(EVENTS.PHASE_UPDATED, handlePhaseUpdated)
      off(EVENTS.TASK_CREATED, handleTaskCreated)
      off(EVENTS.TASK_UPDATED, handleTaskUpdated)
    }
  }, [isConnected, on, off, missionId, fetchMissionData])

  const refresh = useCallback(() => {
    fetchMissionData()
  }, [fetchMissionData])

  return {
    mission,
    isLoading,
    error,
    lastUpdate,
    refresh,
    isConnected,
  }
}
