"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { SessionSummary, fetchSessions } from "@/lib/api"
import { useBeaconSocket } from "@/hooks/useBeaconSocket"

export function useSessions() {
  const { lastEvent } = useBeaconSocket()

  const [data, setData] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true)
    }
    try {
      const sessions = await fetchSessions()
      setData(sessions)
      setError(null)
    } catch (err) {
      console.error("[useSessions] Failed to load sessions:", err)
      setError(err instanceof Error ? err : new Error("Failed to load sessions"))
    } finally {
      if (isInitial) {
        setLoading(false)
      }
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    loadData(true)
  }, [loadData])

  // Periodic polling every 30s with cleanup (ENG-04)
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(false)
    }, 30000)

    return () => clearInterval(interval)
  }, [loadData])

  // Debounced auto-refresh on WebSocket events (1000ms debounce)
  useEffect(() => {
    if (!lastEvent) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      loadData(false)
    }, 1000)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [lastEvent, loadData])

  return {
    data,
    loading,
    error,
    refetch: () => loadData(false),
  }
}

