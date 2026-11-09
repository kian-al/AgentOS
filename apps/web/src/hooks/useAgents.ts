"use client"

import { useState, useEffect, useCallback } from "react"
import { AgentConfig, fetchAgents } from "@/lib/api"

export function useAgents(pollIntervalMs = 60000) {
  const [agents, setAgents] = useState<AgentConfig[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  const loadAgents = useCallback(async (refresh = false, isInitial = false) => {
    if (isInitial) {
      setLoading(true)
    }
    try {
      const data = await fetchAgents(refresh)
      setAgents(data)
      setError(null)
    } catch (err) {
      console.error("[useAgents] Failed to load agent configs:", err)
      setError(err instanceof Error ? err : new Error("Failed to load agents"))
    } finally {
      if (isInitial) {
        setLoading(false)
      }
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    loadAgents(false, true)
  }, [loadAgents])

  // Periodic polling every 60s with cleanup (ENG-04)
  useEffect(() => {
    const id = setInterval(() => {
      loadAgents(false, false)
    }, pollIntervalMs)

    return () => clearInterval(id)
  }, [loadAgents, pollIntervalMs])

  const refetch = useCallback(
    (refresh = true) => {
      return loadAgents(refresh, false)
    },
    [loadAgents]
  )

  return {
    agents,
    data: agents,
    loading,
    error,
    refetch,
  }
}

