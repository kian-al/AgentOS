"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { BeaconEvent, fetchLatestEvents } from "@/lib/api"
import { useBeaconSocket } from "@/hooks/useBeaconSocket"
import { getEventCategory, EventCategory } from "@/lib/eventTypes"

export type FeedFilter = "all" | "agent" | "tool" | "session" | "error"

export function useEventFeed() {
  const { lastEvent, isConnected } = useBeaconSocket()
  const [events, setEvents] = useState<BeaconEvent[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [pendingQueue, setPendingQueue] = useState<BeaconEvent[]>([])
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [debouncedSearch, setDebouncedSearch] = useState<string>("")
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initial load
  useEffect(() => {
    fetchLatestEvents(50)
      .then((data) => {
        setEvents(data)
      })
      .catch((err) => {
        console.warn("[useEventFeed] Could not fetch initial events:", err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // Handle incoming live events
  useEffect(() => {
    if (!lastEvent || !("id" in lastEvent) || !("event_type" in lastEvent)) return

    const beaconEvt = lastEvent as BeaconEvent

    if (isPaused) {
      // Accumulate in pending queue
      setPendingQueue((prev) => [beaconEvt, ...prev])
    } else {
      // Immediately prepend and keep max 200 items in memory
      setEvents((prev) => {
        // Prevent duplicate by id if present
        if (beaconEvt.id && prev.some((e) => e.id === beaconEvt.id)) {
          return prev
        }
        const updated = [beaconEvt, ...prev]
        return updated.slice(0, 200)
      })
    }
  }, [lastEvent, isPaused])

  // Resume and flush pending events
  const resumeAndFlush = useCallback(() => {
    setIsPaused(false)
    if (pendingQueue.length > 0) {
      setEvents((prev) => {
        const combined = [...pendingQueue, ...prev]
        const seen = new Set<number>()
        const unique: BeaconEvent[] = []
        for (const evt of combined) {
          if (evt.id && seen.has(evt.id)) continue
          if (evt.id) seen.add(evt.id)
          unique.push(evt)
        }
        return unique.slice(0, 200)
      })
      setPendingQueue([])
    }
  }, [pendingQueue])

  const togglePause = useCallback(() => {
    if (isPaused) {
      resumeAndFlush()
    } else {
      setIsPaused(true)
    }
  }, [isPaused, resumeAndFlush])

  // Debounce search query by 200ms
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim().toLowerCase())
    }, 200)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  // Filter & Search processing
  const filteredEvents = useMemo(() => {
    let result = events

    // 1. Filter by category tab
    if (activeFilter !== "all") {
      const targetCat: EventCategory =
        activeFilter === "agent"
          ? "AGENT"
          : activeFilter === "tool"
          ? "TOOL"
          : activeFilter === "session"
          ? "SESSION"
          : "ERROR"

      result = result.filter((e) => getEventCategory(e).category === targetCat)
    }

    // 2. Filter by search query
    if (debouncedSearch) {
      result = result.filter((e) => {
        const sessionMatch = e.session_id.toLowerCase().includes(debouncedSearch)
        const agentMatch = (e.agent || "").toLowerCase().includes(debouncedSearch)
        const toolMatch = (e.tool_name || "").toLowerCase().includes(debouncedSearch)
        return sessionMatch || agentMatch || toolMatch
      })
    }

    // Top 50 newest displayed
    return result.slice(0, 50)
  }, [events, activeFilter, debouncedSearch])

  return {
    events: filteredEvents,
    rawCount: events.length,
    loading,
    isPaused,
    togglePause,
    resumeAndFlush,
    pendingCount: pendingQueue.length,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    isConnected,
  }
}

