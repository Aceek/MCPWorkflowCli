'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Mission, Phase } from '@prisma/client'
import { useWebSocket, EVENTS } from './useWebSocket'
import { fetchMissions, type MissionsResponse, type MissionWithPhases } from '@/lib/api'

interface MissionStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  failed: number
  blocked: number
}

interface MissionCreatedEvent {
  mission: Mission
}

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

interface UseRealtimeMissionsOptions {
  status?: string
  enabled?: boolean
}

/**
 * Hook for real-time mission list updates via WebSocket.
 *
 * Fetches initial data via REST API, then listens for WebSocket events
 * to update the data in real-time without polling.
 */
export function useRealtimeMissions(options: UseRealtimeMissionsOptions = {}) {
  const { status, enabled = true } = options

  const [missions, setMissions] = useState<MissionWithPhases[]>([])
  const [stats, setStats] = useState<MissionStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    failed: 0,
    blocked: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Track current filter to avoid stale closures
  const statusRef = useRef(status)
  statusRef.current = status

  // WebSocket connection
  const { isConnected, on, off } = useWebSocket({ autoConnect: enabled })

  // Fetch missions from API
  const fetchMissionsData = useCallback(async () => {
    try {
      const data: MissionsResponse = await fetchMissions(statusRef.current)
      setMissions(data.missions)
      setStats(data.stats)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchMissionsData()
    }
  }, [fetchMissionsData, enabled, status])

  // Handle WebSocket events
  useEffect(() => {
    if (!isConnected) return

    // Mission created - add to list
    const handleMissionCreated = (event: MissionCreatedEvent) => {
      const currentStatus = statusRef.current

      // Only add if matches current filter
      if (
        !currentStatus ||
        currentStatus === 'all' ||
        event.mission.status === currentStatus
      ) {
        setMissions((prev) => {
          // Check if already exists (avoid duplicates)
          if (prev.some((m) => m.id === event.mission.id)) {
            return prev
          }
          // Add to beginning of list
          return [
            {
              ...event.mission,
              phases: [],
              _count: { phases: 0 },
            } as MissionWithPhases,
            ...prev,
          ]
        })
      }

      // Update stats
      setStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        inProgress: prev.inProgress + 1,
      }))

      setLastUpdate(new Date())
    }

    // Mission updated - update in list
    const handleMissionUpdated = (event: MissionUpdatedEvent) => {
      const currentStatus = statusRef.current

      setMissions((prev) => {
        const index = prev.findIndex((m) => m.id === event.mission.id)

        if (index === -1) {
          // Not in list - might need to add if matches filter
          if (
            !currentStatus ||
            currentStatus === 'all' ||
            event.mission.status === currentStatus
          ) {
            return [
              {
                ...event.mission,
                phases: [],
                _count: { phases: 0 },
              } as MissionWithPhases,
              ...prev,
            ]
          }
          return prev
        }

        // Check if should remain in list based on filter
        if (
          currentStatus &&
          currentStatus !== 'all' &&
          event.mission.status !== currentStatus
        ) {
          return prev.filter((m) => m.id !== event.mission.id)
        }

        // Update in place
        const updated = [...prev]
        updated[index] = { ...updated[index]!, ...event.mission }
        return updated
      })

      // Refetch stats to get accurate counts
      fetchMissionsData()

      setLastUpdate(new Date())
    }

    // Phase created - increment phase count for mission
    const handlePhaseCreated = (event: PhaseCreatedEvent) => {
      setMissions((prev) => {
        const index = prev.findIndex((m) => m.id === event.missionId)
        if (index === -1) return prev

        const updated = [...prev]
        const mission = updated[index]!
        updated[index] = {
          ...mission,
          _count: { phases: mission._count.phases + 1 },
          totalPhases: mission.totalPhases + 1,
        }
        return updated
      })

      setLastUpdate(new Date())
    }

    // Phase updated - update mission progress
    const handlePhaseUpdated = (event: PhaseUpdatedEvent) => {
      // Refetch to get accurate phase data
      fetchMissionsData()
      setLastUpdate(new Date())
    }

    // Subscribe to events
    on(EVENTS.MISSION_CREATED, handleMissionCreated)
    on(EVENTS.MISSION_UPDATED, handleMissionUpdated)
    on(EVENTS.PHASE_CREATED, handlePhaseCreated)
    on(EVENTS.PHASE_UPDATED, handlePhaseUpdated)

    return () => {
      off(EVENTS.MISSION_CREATED, handleMissionCreated)
      off(EVENTS.MISSION_UPDATED, handleMissionUpdated)
      off(EVENTS.PHASE_CREATED, handlePhaseCreated)
      off(EVENTS.PHASE_UPDATED, handlePhaseUpdated)
    }
  }, [isConnected, on, off, fetchMissionsData])

  const refresh = useCallback(() => {
    setIsLoading(true)
    fetchMissionsData()
  }, [fetchMissionsData])

  return {
    missions,
    stats,
    isLoading,
    error,
    lastUpdate,
    refresh,
    isConnected,
  }
}
