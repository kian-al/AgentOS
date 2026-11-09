"use client"

import React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useSessionEvents } from "@/hooks/useSessionEvents"
import { SessionEventChart } from "@/components/analytics/SessionEventChart"
import { SessionEventTable } from "@/components/analytics/SessionEventTable"
import { SessionEvent } from "@/lib/api"
import { formatUsd, formatTokens } from "@/lib/format"
import { Layers, X, Cpu } from "lucide-react"

interface SessionDrilldownSheetProps {
  sessionId: string | null
  open: boolean
  onClose: () => void
  totalCost?: number
  overrideEvents?: SessionEvent[]
}

export function SessionDrilldownSheet({
  sessionId,
  open,
  onClose,
  totalCost,
  overrideEvents,
}: SessionDrilldownSheetProps) {
  const { data: hookEvents, loading, error } = useSessionEvents(open ? sessionId : null)
  const events = overrideEvents ?? hookEvents

  const calculatedCost =
    totalCost ??
    events.reduce((acc, curr) => acc + (curr.cost_usd || 0), 0)

  const calculatedTokens = events.reduce(
    (acc, curr) =>
      acc + (curr.token_usage_input + curr.token_usage_output + curr.token_usage_cache_read),
    0
  )

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        className="w-full sm:max-w-3xl overflow-y-auto bg-slate-950 border-l border-slate-800 text-slate-200 p-6 space-y-6"
        aria-describedby="session-drilldown-desc"
      >
        <SheetHeader className="pb-4 border-b border-slate-800/80 pr-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-400" aria-hidden="true" />
                <SheetTitle className="text-base font-bold text-white font-mono">
                  {sessionId || "Session Details"}
                </SheetTitle>
              </div>
              <SheetDescription
                id="session-drilldown-desc"
                className="text-xs text-slate-400 mt-1"
              >
                Granular per-event token consumption and cost audit
              </SheetDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-slate-700 bg-slate-900 font-mono text-xs text-slate-300"
              >
                {formatTokens(calculatedTokens)} tokens
              </Badge>
              <Badge
                variant="outline"
                className="border-emerald-600/30 bg-emerald-950/40 text-emerald-400 font-mono text-xs font-semibold"
              >
                Total: {formatUsd(calculatedCost)}
              </Badge>
            </div>
          </div>

          {/* Close button with mandatory accessible aria-label */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close session drilldown"
            className="absolute right-4 top-4 rounded-md p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Close session drilldown</span>
          </button>
        </SheetHeader>

        {loading ? (
          <div className="h-60 flex flex-col items-center justify-center gap-2 text-xs font-mono text-slate-400">
            <Cpu className="h-5 w-5 animate-spin text-purple-400" aria-hidden="true" />
            <span>Loading session events...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg border border-red-900/40 bg-red-950/20 text-red-300 text-xs font-mono">
            {error.message}
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. Stacked Horizontal Bar Chart (ENG-03 subcomponent) */}
            <SessionEventChart events={events} />

            {/* 2. Detailed Per-Event Audit Table (ENG-03 subcomponent) */}
            <div>
              <div className="text-xs font-semibold text-slate-300 mb-2">
                Event Execution Audit ({events.length} records)
              </div>
              <SessionEventTable sessionId={sessionId || "session"} events={events} />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

