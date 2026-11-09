"use client"

import { useState, useEffect, useCallback } from "react"
import { AgentDetail, fetchAgentDetail } from "@/lib/api"

export function useAgentDetail(name: string | null) {
  const [data, setData] = useState<AgentDetail | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const loadData = useCallback(async () => {
    if (!name) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    try {
      const detail = await fetchAgentDetail(name)
      setData(detail)
      setError(null)
    } catch (err) {
      console.error(`[useAgentDetail] Failed to load agent detail for ${name}:`, err)
      setError(err instanceof Error ? err : new Error("Failed to load agent details"))
    } finally {
      setLoading(false)
    }
  }, [name])

  // Fetch when name changes
  useEffect(() => {
    loadData()
  }, [loadData])

  // Periodic polling interval while open (30s refresh) with clearInterval cleanup (ENG-04)
  useEffect(() => {
    if (!name) return

    const interval = setInterval(() => {
      if (name) {
        fetchAgentDetail(name)
          .then((detail) => {
            setData(detail)
            setError(null)
          })
          .catch((err) => {
            console.error(`[useAgentDetail] Polling refresh error:`, err)
          })
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [name])

  return {
    data,
    loading,
    error,
    refetch: loadData,
  }
}

