"use client"

import React from "react"
import { SessionEvent } from "@/lib/api"
import { formatTokens, formatUsd } from "@/lib/format"
import { Badge } from "@/components/ui/badge"

interface SessionEventTableProps {
  sessionId: string
  events: SessionEvent[]
}

export function SessionEventTable({ sessionId, events }: SessionEventTableProps) {
  if (!events || events.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-500 font-mono">
        No event records found for this session.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto border border-slate-800/80 rounded-lg">
      <table
        role="table"
        aria-label={`Events for session ${sessionId}`}
        className="w-full text-left text-xs border-collapse font-mono"
      >
        <caption className="sr-only">Events for session {sessionId}</caption>
        <thead>
          <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 text-[11px] uppercase tracking-wider">
            <th scope="col" className="py-2.5 px-3">Time</th>
            <th scope="col" className="py-2.5 px-3">Type</th>
            <th scope="col" className="py-2.5 px-3">Agent</th>
            <th scope="col" className="py-2.5 px-3">Model</th>
            <th scope="col" className="py-2.5 px-3">Tool</th>
            <th scope="col" className="py-2.5 px-3 text-right">Input</th>
            <th scope="col" className="py-2.5 px-3 text-right">Output</th>
            <th scope="col" className="py-2.5 px-3 text-right">Cache</th>
            <th scope="col" className="py-2.5 px-3 text-right">Cost</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => {
            let timeStr = ev.timestamp
            try {
              const d = new Date(ev.timestamp)
              if (!isNaN(d.getTime())) {
                timeStr = d.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })
              }
            } catch {
              timeStr = ev.timestamp
            }

            return (
              <tr
                key={ev.id}
                className="border-b border-slate-800/50 even:bg-slate-900/40 hover:bg-slate-800/40 transition-colors"
              >
                <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                  {timeStr}
                </td>
                <td className="py-2 px-3">
                  <Badge
                    variant="outline"
                    className="border-slate-700 bg-slate-950 text-[10px] font-normal"
                  >
                    {ev.event_type}
                  </Badge>
                </td>
                <td className="py-2 px-3 text-slate-300 font-semibold truncate max-w-[120px]" title={ev.agent}>
                  {ev.agent || "—"}
                </td>
                <td className="py-2 px-3 text-slate-400 text-[11px] truncate max-w-[110px]" title={ev.model}>
                  {ev.model || "—"}
                </td>
                <td className="py-2 px-3 text-slate-300">
                  {ev.tool_name ? (
                    <span className="text-chart-tool font-semibold">{ev.tool_name}</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 px-3 text-right text-slate-300 tabular-nums">
                  {formatTokens(ev.token_usage_input)}
                </td>
                <td className="py-2 px-3 text-right text-slate-300 tabular-nums">
                  {formatTokens(ev.token_usage_output)}
                </td>
                <td className="py-2 px-3 text-right text-slate-400 tabular-nums">
                  {formatTokens(ev.token_usage_cache_read)}
                </td>
                <td className="py-2 px-3 text-right font-semibold text-emerald-400 tabular-nums">
                  {formatUsd(ev.cost_usd)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

