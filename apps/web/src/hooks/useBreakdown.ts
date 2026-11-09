"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { BreakdownItem, fetchBreakdown } from "@/lib/api"
import { useRangeStore } from "@/store/rangeStore"
import { useBeaconSocket } from "@/hooks/useBeaconSocket"

export function useBreakdown(by: "model" | "agent") {
  const { range } = useRangeStore()
  const { lastEvent } = useBeaconSocket()
  const [data, setData] = useState<BreakdownItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const loadData = useCallback(
    async (isInitial = false) => {
      if (isInitial) {
        setLoading(true)
      }
      try {
        const items = await fetchBreakdown(by, range)
        setData(items)
        setError(null)
      } catch (err) {
        console.error(`[useBreakdown] Failed to load ${by} breakdown:`, err)
        setError(err instanceof Error ? err : new Error(`Failed to load ${by} breakdown`))
      } finally {
        if (isInitial) {
          setLoading(false)
        }
      }
    },
    [by, range]
  )

  // Load when range or 'by' dimension changes
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
  }
}

