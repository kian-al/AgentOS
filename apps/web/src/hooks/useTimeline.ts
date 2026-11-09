"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { TimelineBucket, fetchTimeline } from "@/lib/api"
import { useRangeStore } from "@/store/rangeStore"
import { useBeaconSocket } from "@/hooks/useBeaconSocket"

export function useTimeline() {
  const { range } = useRangeStore()
  const { lastEvent } = useBeaconSocket()
  const [data, setData] = useState<TimelineBucket[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true)
    }
    try {
      const buckets = await fetchTimeline(range)
      setData(buckets)
      setError(null)
    } catch (err) {
      console.error("[useTimeline] Failed to load timeline data:", err)
      setError(err instanceof Error ? err : new Error("Failed to load timeline data"))
    } finally {
      if (isInitial) {
        setLoading(false)
      }
    }
  }, [range])

  // Load when range changes
  useEffect(() => {
    loadData(true)
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
    range,
  }
}

