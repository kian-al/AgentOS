"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { MetricsSummary, fetchMetricsSummary } from "@/lib/api"
import { useBeaconSocket } from "@/hooks/useBeaconSocket"

export function useMetricsSummary() {
  const [data, setData] = useState<MetricsSummary | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { lastEvent } = useBeaconSocket()

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true)
    }
    try {
      const summary = await fetchMetricsSummary()
      setData(summary)
      setError(null)
    } catch (err) {
      console.error("[useMetricsSummary] Failed to load metrics summary:", err)
      setError(err instanceof Error ? err : new Error("Failed to load metrics summary"))
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

  // Debounced auto-refresh on new WebSocket events (1 second debounce)
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

