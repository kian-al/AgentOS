"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useBreakdown } from "@/hooks/useBreakdown"
import { useRangeStore } from "@/store/rangeStore"
import { useBreakdownHighlightStore } from "@/store/breakdownHighlightStore"
import { formatTokens, formatUsd } from "@/lib/format"
import { Bot, BarChart2 } from "lucide-react"

export function AgentBreakdown() {
  const { range } = useRangeStore()
  const { data, loading, error } = useBreakdown("agent")
  const { highlightedKey, highlightedIndex, setHighlight, clearHighlight } =
    useBreakdownHighlightStore()

  return (
    <Card className="border-slate-800 bg-slate-900/60 shadow-sm flex flex-col">
      <CardHeader className="pb-2 border-b border-slate-800/70 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Bot className="h-4 w-4 text-blue-400" aria-hidden="true" />
            By Agent
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Resource consumption ranked by autonomous agent
          </CardDescription>
        </div>
        <Badge
          variant="outline"
          className="border-slate-700 font-mono text-[11px] text-slate-300"
        >
          {range}
        </Badge>
      </CardHeader>

      <CardContent className="pt-4 flex-1 flex flex-col justify-between">
        {loading ? (
          <div
            className="h-[260px] flex items-center justify-center animate-pulse"
            aria-label="Loading agent breakdown"
          >
            <div className="h-40 w-40 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="h-[260px] flex flex-col items-center justify-center text-center p-6 border border-red-900/40 bg-red-950/20 rounded-lg">
            <p className="text-sm font-medium text-red-300">
              Failed to load agent breakdown
            </p>
            <p className="text-xs text-red-400/80 mt-1">{error.message}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[260px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-lg">
            <BarChart2 className="h-8 w-8 text-slate-500 mb-2 opacity-50" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-300">
              No agent telemetry recorded
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              No agent activities detected in the selected {range} window.
            </p>
          </div>
        ) : (
          <div className="space-y-3" role="list" aria-label="Breakdown by agent">
            {data.map((item, index) => {
              const isHighlighted =
                highlightedKey === item.key || highlightedIndex === index
              const isAnyHighlighted =
                highlightedKey !== null || highlightedIndex !== null

              return (
                <div
                  key={item.key}
                  role="listitem"
                  tabIndex={0}
                  aria-label={`${item.key}: ${formatTokens(item.tokens)} tokens, ${formatUsd(
                    item.cost_usd
                  )}, ${item.pct} percent of spend`}
                  onMouseEnter={() => setHighlight(item.key, index)}
                  onMouseLeave={() => clearHighlight()}
                  onFocus={() => setHighlight(item.key, index)}
                  onBlur={() => clearHighlight()}
                  className={`p-2 rounded-lg transition-all cursor-pointer select-none border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400 ${
                    isHighlighted
                      ? "bg-blue-950/40 border-blue-500/50 shadow-sm"
                      : isAnyHighlighted
                      ? "opacity-60 border-transparent hover:border-slate-800"
                      : "bg-slate-950/30 border-slate-800/50 hover:bg-slate-800/30"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                    <span
                      className={`font-semibold truncate max-w-[160px] sm:max-w-[200px] ${
                        isHighlighted ? "text-blue-300" : "text-slate-200"
                      }`}
                      title={item.key}
                    >
                      {item.key}
                    </span>

                    <div className="flex items-center gap-3 tabular-nums">
                      <span className="text-slate-400 text-[11px] hidden sm:inline">
                        {formatTokens(item.tokens)}
                      </span>
                      <span className="text-emerald-400 font-semibold min-w-[50px] text-right">
                        {formatUsd(item.cost_usd)}
                      </span>
                      <span className="text-blue-400 font-bold min-w-[36px] text-right">
                        {item.pct}%
                      </span>
                    </div>
                  </div>

                  {/* Horizontal % Fill Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isHighlighted
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 shadow-sm"
                          : "bg-blue-500/80"
                      }`}
                      style={{ width: `${Math.max(item.pct, 1)}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              )
            })}

            {/* Screen-reader summary table */}
            <table className="sr-only">
              <caption>Resource consumption by agent</caption>
              <thead>
                <tr>
                  <th scope="col">Agent</th>
                  <th scope="col">Tokens</th>
                  <th scope="col">Cost (USD)</th>
                  <th scope="col">Share</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={`sr-agent-${item.key}`}>
                    <td>{item.key}</td>
                    <td>{formatTokens(item.tokens)}</td>
                    <td>{formatUsd(item.cost_usd)}</td>
                    <td>{item.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

