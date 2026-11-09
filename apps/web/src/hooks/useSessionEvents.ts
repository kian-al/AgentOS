"use client"

import { useState, useEffect, useCallback } from "react"
import { SessionEvent, fetchSessionEvents } from "@/lib/api"

export function useSessionEvents(sessionId: string | null) {
  const [data, setData] = useState<SessionEvent[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const loadData = useCallback(async () => {
    if (!sessionId) {
      setData([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    try {
      const events = await fetchSessionEvents(sessionId)
      setData(events)
      setError(null)
    } catch (err) {
      console.error(`[useSessionEvents] Failed to load events for ${sessionId}:`, err)
      setError(err instanceof Error ? err : new Error("Failed to load session events"))
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  // Fetch when sessionId changes
  useEffect(() => {
    loadData()
  }, [loadData])

  // Periodic polling interval while session drilldown is active (ENG-04 cleanup)
  useEffect(() => {
    if (!sessionId) return

    const interval = setInterval(() => {
      if (sessionId) {
        fetchSessionEvents(sessionId)
          .then((events) => {
            setData(events)
            setError(null)
          })
          .catch((err) => {
            console.error(`[useSessionEvents] Polling refresh error:`, err)
          })
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [sessionId])

  return {
    data,
    loading,
    error,
    refetch: loadData,
  }
}

