"use client"

import React, { useState } from "react"
import { AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEventFeed, FeedFilter } from "@/hooks/useEventFeed"
import { EventRow } from "@/components/dashboard/EventRow"
import { EventDetailSheet } from "@/components/dashboard/EventDetailSheet"
import { Skeleton } from "@/components/shared/Skeleton"
import { BeaconEvent } from "@/lib/api"
import {
  Activity,
  Search,
  Pause,
  Play,
  RotateCcw,
  Inbox,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const FILTER_TABS: { id: FeedFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "agent", label: "Agent" },
  { id: "tool", label: "Tool" },
  { id: "session", label: "Session" },
  { id: "error", label: "Error" },
]

export function EventFeed() {
  const {
    events,
    rawCount,
    loading,
    isPaused,
    togglePause,
    resumeAndFlush,
    pendingCount,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
  } = useEventFeed()

  const [selectedEvent, setSelectedEvent] = useState<BeaconEvent | null>(null)
  const [sheetOpen, setSheetOpen] = useState<boolean>(false)

  const handleSelectEvent = (event: BeaconEvent) => {
    setSelectedEvent(event)
    setSheetOpen(true)
  }

  return (
    <>
      <Card className="border-slate-800 bg-slate-900/60 shadow-sm backdrop-blur flex flex-col">
        {/* Feed Header */}
        <CardHeader className="p-4 sm:p-5 border-b border-slate-800/70">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Title & Live Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                <CardTitle className="text-base font-semibold text-white tracking-tight">
                  Live Events
                </CardTitle>
              </div>
              <span className="text-xs font-mono text-slate-400">
                ({events.length} shown · {rawCount} in buffer)
              </span>
            </div>

            {/* Controls: Search + Filter Tabs + Pause Button */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="relative min-w-[180px] sm:min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search agent, tool, session…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-md bg-slate-950/80 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              {/* Filter Tabs */}
              <div
                role="tablist"
                aria-label="Filter events by type"
                className="inline-flex items-center p-0.5 rounded-lg border border-slate-800 bg-slate-950/80 text-xs"
              >
                {FILTER_TABS.map((tab) => {
                  const isActive = activeFilter === tab.id
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls="live-event-feed"
                      onClick={() => setActiveFilter(tab.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 ${
                        isActive
                          ? "bg-blue-600 text-white font-semibold shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                      }`}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Pause & Flush Controls */}
              <div className="flex items-center gap-1.5">
                {isPaused && pendingCount > 0 && (
                  <button
                    type="button"
                    role="status"
                    aria-live="polite"
                    aria-label={`${pendingCount} new events pending. Click to resume and flush.`}
                    onClick={resumeAndFlush}
                    title="Click to resume and flush pending events"
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono font-medium bg-blue-900/60 text-blue-300 border border-blue-700/60 hover:bg-blue-800/60 transition-colors animate-pulse shadow-[0_0_8px_hsl(var(--primary)/0.3)]"
                  >
                    <RotateCcw className="h-3 w-3" />
                    +{pendingCount} new
                  </button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePause}
                  aria-pressed={isPaused}
                  aria-label={isPaused ? "Resume live feed" : "Pause live feed"}
                  className={`h-8 px-2.5 text-xs border-slate-800 transition-colors ${
                    isPaused
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                      : "bg-slate-950/80 hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  {isPaused ? (
                    <>
                      <Play className="h-3.5 w-3.5 mr-1 text-amber-400" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="h-3.5 w-3.5 mr-1 text-slate-400" />
                      Pause
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Column Subheader */}
        <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-slate-400 bg-slate-950/40 border-b border-slate-800/60 select-none">
          <span className="col-span-2">Time</span>
          <span className="col-span-2">Type</span>
          <span className="col-span-3">Agent</span>
          <span className="col-span-2">Model</span>
          <span className="col-span-1">Tool</span>
          <span className="col-span-2 text-right">Tokens & Cost</span>
        </div>

        {/* Feed List Container */}
        <CardContent className="p-0">
          <div
            id="live-event-feed"
            role="feed"
            aria-live="polite"
            aria-label="Real-time Beacon events"
            className="divide-y divide-slate-800/40 max-h-[440px] overflow-y-auto"
          >
            {loading ? (
              <div className="p-2 space-y-1">
                <Skeleton variant="row" count={6} />
              </div>
            ) : events.length === 0 ? (
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
                <Inbox className="h-8 w-8 text-slate-500 mb-2 opacity-50" />
                <p className="text-sm font-medium text-slate-300">
                  No matching events found
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  {searchQuery
                    ? `No events matched your search query "${searchQuery}".`
                    : `No events in the "${activeFilter}" category.`}
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {events.map((evt, idx) => (
                  <EventRow
                    key={evt.id || `${evt.session_id}-${evt.timestamp}-${idx}`}
                    event={evt}
                    onSelect={handleSelectEvent}
                    animateEntrance={!isPaused && idx < 5}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inspect Detail Drawer */}
      <EventDetailSheet
        event={selectedEvent}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  )
}
