"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ProjectionResult, fetchProjection } from "@/lib/api"
import { useBeaconSocket } from "@/hooks/useBeaconSocket"

export function useProjection() {
  const { lastEvent } = useBeaconSocket()

  const [data, setData] = useState<ProjectionResult | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true)
    }
    try {
      const result = await fetchProjection()
      setData(result)
      setError(null)
    } catch (err) {
      console.error("[useProjection] Failed to load cost projection:", err)
      setError(err instanceof Error ? err : new Error("Failed to load cost projection"))
    } finally {
      if (isInitial) {
        setLoading(false)
      }
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadData(true)
  }, [loadData])

  // Periodic polling every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(false)
    }, 60000)
    return () => clearInterval(interval)
  }, [loadData])

  // Debounced auto-refresh on WebSocket events (1500ms debounce)
  useEffect(() => {
    if (!lastEvent) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      loadData(false)
    }, 1500)

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

