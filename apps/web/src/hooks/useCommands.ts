"use client"

import { useState, useEffect, useCallback } from "react"
import { CommandConfig, fetchCommands } from "@/lib/api"

export function useCommands(pollIntervalMs = 60000) {
  const [commands, setCommands] = useState<CommandConfig[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  const loadCommands = useCallback(async (refresh = false, isInitial = false) => {
    if (isInitial) {
      setLoading(true)
    }
    try {
      const data = await fetchCommands(refresh)
      setCommands(data)
      setError(null)
    } catch (err) {
      console.error("[useCommands] Failed to load command configs:", err)
      setError(err instanceof Error ? err : new Error("Failed to load commands"))
    } finally {
      if (isInitial) {
        setLoading(false)
      }
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    loadCommands(false, true)
  }, [loadCommands])

  // Periodic polling every 60s with clearInterval cleanup (ENG-04)
  useEffect(() => {
    const id = setInterval(() => {
      loadCommands(false, false)
    }, pollIntervalMs)

    return () => clearInterval(id)
  }, [loadCommands, pollIntervalMs])

  const refetch = useCallback(
    (refresh = true) => {
      return loadCommands(refresh, false)
    },
    [loadCommands]
  )

  return {
    commands,
    data: commands,
    loading,
    error,
    refetch,
  }
}

