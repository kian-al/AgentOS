"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchHealth, HealthResponse } from "@/lib/api"

export interface HealthState {
  isOnline: boolean
  version: string
  loading: boolean
  error: Error | null
  lastChecked: Date | null
  recheck: () => Promise<void>
}

/**
 * useHealthCheck hook polls GET /api/health every intervalMs (default 10,000ms).
 * Gracefully handles fetch errors (marking isOnline: false) without crashing.
 */
export function useHealthCheck(intervalMs = 10000): HealthState {
  const [isOnline, setIsOnline] = useState<boolean>(false)
  const [version, setVersion] = useState<string>("0.1.0")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const check = useCallback(async () => {
    try {
      const data: HealthResponse = await fetchHealth()
      setIsOnline(true)
      if (data.version) setVersion(data.version)
      setError(null)
    } catch (err) {
      setIsOnline(false)
      setError(err instanceof Error ? err : new Error("Health check failed"))
    } finally {
      setLoading(false)
      setLastChecked(new Date())
    }
  }, [])

  useEffect(() => {
    check()
    const timer = setInterval(check, intervalMs)
    return () => clearInterval(timer)
  }, [check, intervalMs])

  return {
    isOnline,
    version,
    loading,
    error,
    lastChecked,
    recheck: check,
  }
}

