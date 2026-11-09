"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSessions } from "@/hooks/useSessions"
import { SessionSummary } from "@/lib/api"
import { formatTokens, formatUsd } from "@/lib/format"
import { SessionDrilldownSheet } from "@/components/analytics/SessionDrilldownSheet"
import { History, Cpu, ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/shared/Skeleton"

interface SessionListProps {
  overrideData?: SessionSummary[]
}

function formatDuration(startedAt: string, endedAt: string): string {
  if (!startedAt || !endedAt) return "—"
  const start = new Date(startedAt).getTime()
  const end = new Date(endedAt).getTime()
  if (isNaN(start) || isNaN(end) || end < start) return "—"
  const diffSec = Math.round((end - start) / 1000)
  if (diffSec < 60) return `${diffSec}s`
  const min = Math.floor(diffSec / 60)
  const sec = diffSec % 60
  if (min < 60) return `${min}m ${sec}s`
  const hr = Math.floor(min / 60)
  return `${hr}h ${min % 60}m`
}

function formatStartedAt(iso: string): string {
  if (!iso) return "—"
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  } catch {
    return iso
  }
}

export function SessionList({ overrideData }: SessionListProps) {
  const { data: hookData, loading, error } = useSessions()
  const data = overrideData ?? hookData

  const [selectedSession, setSelectedSession] = useState<SessionSummary | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false)

  const handleOpenDrilldown = (session: SessionSummary) => {
    setSelectedSession(session)
    setIsSheetOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent, session: SessionSummary) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleOpenDrilldown(session)
    }
  }

  const isEmpty = !loading && data && data.length === 0

  return (
    <Card className="border-slate-800 bg-slate-900/60 shadow-sm flex flex-col">
      <CardHeader className="pb-3 border-b border-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base text-white flex items-center gap-2">
            <History className="h-4 w-4 text-blue-400" aria-hidden="true" />
            Recent Sessions
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs mt-0.5">
            Detailed telemetry per session. Select any session to inspect event breakdown.
          </CardDescription>
        </div>

        <Badge
          variant="outline"
          className="border-slate-700 font-mono text-[11px] text-slate-300 w-fit"
        >
          {data ? data.length : 0} sessions recorded
        </Badge>
      </CardHeader>

      <CardContent className="pt-4 flex-1">
        {loading ? (
          <div
            className="space-y-1 p-2"
            aria-label="Loading sessions list"
          >
            <Skeleton variant="row" count={4} />
          </div>
        ) : error ? (
          <div className="h-[200px] flex flex-col items-center justify-center text-center p-6 border border-red-900/40 bg-red-950/20 rounded-lg">
            <p className="text-sm font-medium text-red-300">
              Failed to load recent sessions
            </p>
            <p className="text-xs text-red-400/80 mt-1">{error.message}</p>
          </div>
        ) : isEmpty ? (
          <div className="h-[200px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-lg">
            <Cpu className="h-8 w-8 text-slate-500 mb-2 opacity-50" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-300">
              No session telemetry recorded
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Sessions will appear here once Claude Code agents process user requests.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              role="table"
              aria-label="Recent sessions table"
              className="w-full text-left text-xs border-collapse font-mono"
            >
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                  <th scope="col" className="py-2.5 px-3">
                    Session ID
                  </th>
                  <th scope="col" className="py-2.5 px-3">
                    Started
                  </th>
                  <th scope="col" className="py-2.5 px-3 text-right">
                    Events
                  </th>
                  <th scope="col" className="py-2.5 px-3 text-right">
                    Tokens
                  </th>
                  <th scope="col" className="py-2.5 px-3 text-right">
                    Cost
                  </th>
                  <th scope="col" className="py-2.5 px-3 text-right">
                    Duration
                  </th>
                  <th scope="col" className="py-2.5 px-3 w-8">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {data?.map((s) => (
                  <tr
                    key={s.session_id}
                    tabIndex={0}
                    role="row"
                    aria-label={`Open session ${s.session_id}: ${s.events} events, ${formatUsd(s.cost_usd)}`}
                    onClick={() => handleOpenDrilldown(s)}
                    onKeyDown={(e) => handleKeyDown(e, s)}
                    className="border-b border-slate-800/60 even:bg-slate-900/40 hover:bg-slate-800/50 hover:text-white cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-inset group"
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-200 group-hover:text-white truncate max-w-[140px] sm:max-w-[200px]">
                      {s.session_id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {formatStartedAt(s.started_at)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                      {s.events.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                      {formatTokens(s.tokens)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold tabular-nums">
                      {formatUsd(s.cost_usd)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400 tabular-nums">
                      {formatDuration(s.started_at, s.ended_at)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 inline-block transition-transform group-hover:translate-x-0.5" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <SessionDrilldownSheet
        sessionId={selectedSession ? selectedSession.session_id : null}
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        totalCost={selectedSession?.cost_usd}
      />
    </Card>
  )
}
