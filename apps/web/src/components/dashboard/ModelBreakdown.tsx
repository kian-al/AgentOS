"use client"

import React from "react"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useBreakdown } from "@/hooks/useBreakdown"
import { useRangeStore } from "@/store/rangeStore"
import { useBreakdownHighlightStore } from "@/store/breakdownHighlightStore"
import { useChartColors, ChartToken } from "@/lib/chartColors"
import { formatTokens, formatUsd } from "@/lib/format"
import { Cpu, PieChart as PieChartIcon } from "lucide-react"

const PALETTE_TOKENS: ChartToken[] = [
  "input",
  "output",
  "cost",
  "agent",
  "tool",
  "cache",
  "error",
  "session",
]

export function ModelBreakdown() {
  const { range } = useRangeStore()
  const { data, loading, error } = useBreakdown("model")
  const { highlightedKey, highlightedIndex, setHighlight, clearHighlight } =
    useBreakdownHighlightStore()
  const chartColors = useChartColors()

  const totalCost = data.reduce((acc, curr) => acc + curr.cost_usd, 0)
  const totalTokens = data.reduce((acc, curr) => acc + curr.tokens, 0)

  return (
    <Card className="border-slate-800 bg-slate-900/60 shadow-sm flex flex-col">
      <CardHeader className="pb-2 border-b border-slate-800/70 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Cpu className="h-4 w-4 text-purple-400" aria-hidden="true" />
            By Model
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Token & cost distribution across AI models
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
            aria-label="Loading model breakdown"
          >
            <div className="h-40 w-40 rounded-full border-4 border-slate-800 border-t-purple-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="h-[260px] flex flex-col items-center justify-center text-center p-6 border border-red-900/40 bg-red-950/20 rounded-lg">
            <p className="text-sm font-medium text-red-300">
              Failed to load model breakdown
            </p>
            <p className="text-xs text-red-400/80 mt-1">{error.message}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[260px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-lg">
            <PieChartIcon className="h-8 w-8 text-slate-500 mb-2 opacity-50" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-300">
              No model telemetry recorded
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              No model executions detected in the selected {range} window.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Donut Chart with Centered KPI */}
            <div className="relative h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null
                      const item = payload[0].payload
                      return (
                        <div className="rounded-lg border border-slate-800 bg-slate-950/95 p-2.5 shadow-xl text-xs backdrop-blur font-mono">
                          <p className="font-semibold text-white">{item.key}</p>
                          <div className="mt-1 space-y-0.5 text-slate-300 text-[11px]">
                            <p>Tokens: {formatTokens(item.tokens)}</p>
                            <p>Cost: {formatUsd(item.cost_usd)}</p>
                            <p className="text-purple-400">Share: {item.pct}%</p>
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Pie
                    data={data}
                    dataKey="cost_usd"
                    nameKey="key"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={2}
                    onMouseEnter={(entry, idx) => setHighlight(entry.key, idx)}
                    onMouseLeave={() => clearHighlight()}
                  >
                    {data.map((entry, index) => {
                      const colorToken = PALETTE_TOKENS[index % PALETTE_TOKENS.length]
                      const color = chartColors[colorToken]
                      const isHighlighted =
                        highlightedKey === entry.key || highlightedIndex === index
                      const isAnyHighlighted =
                        highlightedKey !== null || highlightedIndex !== null

                      return (
                        <Cell
                          key={`cell-${entry.key}-${index}`}
                          fill={color}
                          stroke={isHighlighted ? "hsl(var(--foreground))" : "hsl(var(--card))"}
                          strokeWidth={isHighlighted ? 2.5 : 1}
                          opacity={isAnyHighlighted && !isHighlighted ? 0.45 : 1}
                          style={{
                            cursor: "pointer",
                            transition: "all 150ms ease-out",
                            filter: isHighlighted ? "drop-shadow(0 0 6px hsl(var(--chart-output)/0.4))" : "none",
                          }}
                        />
                      )
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Donut Summary */}
              <div
                className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center select-none"
                aria-hidden="true"
              >
                <span className="text-lg font-bold font-mono text-white tracking-tight">
                  {formatUsd(totalCost)}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  {formatTokens(totalTokens)} tok
                </span>
              </div>
            </div>

            {/* Model Legend & Rows */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/60 max-h-[140px] overflow-y-auto">
              {data.map((item, index) => {
                const colorToken = PALETTE_TOKENS[index % PALETTE_TOKENS.length]
                const color = chartColors[colorToken]
                const isHighlighted =
                  highlightedKey === item.key || highlightedIndex === index

                return (
                  <div
                    key={item.key}
                    tabIndex={0}
                    role="button"
                    aria-label={`${item.key}: ${formatTokens(item.tokens)} tokens, ${formatUsd(
                      item.cost_usd
                    )}, ${item.pct} percent share`}
                    onMouseEnter={() => setHighlight(item.key, index)}
                    onMouseLeave={() => clearHighlight()}
                    onFocus={() => setHighlight(item.key, index)}
                    onBlur={() => clearHighlight()}
                    className={`group flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400 ${
                      isHighlighted
                        ? "bg-purple-950/40 border border-purple-500/30"
                        : "hover:bg-slate-800/40 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                        aria-hidden="true"
                      />
                      <span className="font-mono text-slate-200 truncate group-hover:text-white" title={item.key}>
                        {item.key}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 font-mono tabular-nums text-right">
                      <span className="text-slate-400 text-[11px] hidden sm:inline">
                        {formatTokens(item.tokens)}
                      </span>
                      <span className="text-emerald-400 font-semibold min-w-[50px]">
                        {formatUsd(item.cost_usd)}
                      </span>
                      <span className="text-purple-400 font-bold min-w-[36px]">
                        {item.pct}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Accessible Screen-Reader Alternative (WCAG 1.1.1) */}
            <table className="sr-only">
              <caption>Token and cost breakdown by model</caption>
              <thead>
                <tr>
                  <th scope="col">Model</th>
                  <th scope="col">Tokens</th>
                  <th scope="col">Cost (USD)</th>
                  <th scope="col">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={`sr-${item.key}`}>
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

