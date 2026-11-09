"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ModelStat, fetchModelStats } from "@/lib/api"
import { useRangeStore, TimeRange } from "@/store/rangeStore"
import { useBeaconSocket } from "@/hooks/useBeaconSocket"

export function useModelStats(defaultRange: TimeRange = "24h") {
  const globalRange = useRangeStore((state) => state.range)
  const setGlobalRange = useRangeStore((state) => state.setRange)
  const { lastEvent } = useBeaconSocket()

  // Use global range if it's 24h, 7d, or 30d; otherwise fallback to defaultRange
  const validRange =
    globalRange === "24h" || globalRange === "7d" || globalRange === "30d"
      ? globalRange
      : defaultRange

  const [data, setData] = useState<ModelStat[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const loadData = useCallback(
    async (isInitial = false) => {
      if (isInitial) {
        setLoading(true)
      }
      try {
        const stats = await fetchModelStats(validRange)
        setData(stats)
        setError(null)
      } catch (err) {
        console.error("[useModelStats] Failed to load model stats:", err)
        setError(err instanceof Error ? err : new Error("Failed to load model statistics"))
      } finally {
        if (isInitial) {
          setLoading(false)
        }
      }
    },
    [validRange]
  )

  // Fetch when range changes
  useEffect(() => {
    loadData(true)
  }, [loadData])

  // Periodic polling every 30s
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
    range: validRange,
    setRange: setGlobalRange,
    refetch: () => loadData(false),
  }
}

