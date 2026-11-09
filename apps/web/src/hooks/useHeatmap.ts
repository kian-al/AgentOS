"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { HeatmapDay, fetchHeatmap } from "@/lib/api"
import { useBeaconSocket } from "@/hooks/useBeaconSocket"

export type HeatmapRange = "90d" | "180d"

export function useHeatmap(initialRange: HeatmapRange = "90d") {
  const [range, setRange] = useState<HeatmapRange>(initialRange)
  const [data, setData] = useState<HeatmapDay[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const { lastEvent } = useBeaconSocket()
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const loadData = useCallback(
    async (isInitial = false) => {
      if (isInitial) {
        setLoading(true)
      }
      try {
        const result = await fetchHeatmap(range)
        setData(result)
        setError(null)
      } catch (err) {
        console.error("[useHeatmap] Failed to fetch heatmap:", err)
        setError(err instanceof Error ? err : new Error("Failed to load heatmap data"))
      } finally {
        if (isInitial) {
          setLoading(false)
        }
      }
    },
    [range]
  )

  // Fetch when range changes
  useEffect(() => {
    loadData(true)
  }, [loadData])

  // Periodic polling every 30s as specified in Sprint 2
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(false)
    }, 30000)

    return () => clearInterval(interval)
  }, [loadData])

  // WebSocket trigger
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
    range,
    setRange,
    refetch: () => loadData(false),
  }
}

