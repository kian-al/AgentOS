"use client"

import React, { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useModelStats } from "@/hooks/useModelStats"
import { ModelStat } from "@/lib/api"
import { formatTokens, formatUsd } from "@/lib/format"
import { Layers, ArrowUpDown } from "lucide-react"
import { Skeleton } from "@/components/shared/Skeleton"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { DURATION, EASING } from "@/lib/animations"

interface ModelComparisonTableProps {
  overrideData?: ModelStat[]
}

type SortColumn = "model" | "events" | "tokens" | "cost_usd" | "cost_per_million"
type SortDirection = "asc" | "desc"

export function ModelComparisonTable({ overrideData }: ModelComparisonTableProps) {
  const { data: hookData, loading, error, range, setRange } = useModelStats("24h")
  const data = overrideData ?? hookData
  const prefersReduced = useReducedMotion()

  const [sortCol, setSortCol] = useState<SortColumn>("cost_usd")
  const [sortDir, setSortDir] = useState<SortDirection>("desc")

  const handleSort = (column: SortColumn) => {
    if (sortCol === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortCol(column)
      setSortDir(column === "model" ? "asc" : "desc")
    }
  }

  // 1. Compute min cost per million for efficiency scaling
  const minCostPerM = useMemo(() => {
    if (!data || data.length === 0) return 1
    const valid = data.map((d) => d.cost_per_million).filter((c) => c > 0)
    return valid.length > 0 ? Math.min(...valid) : 1
  }, [data])

  // 2. Client-side sort
  const sortedData = useMemo(() => {
    if (!data) return []
    return [...data].sort((a, b) => {
      let comparison = 0
      if (sortCol === "model") {
        comparison = a.model.localeCompare(b.model)
      } else {
        comparison = (a[sortCol] || 0) - (b[sortCol] || 0)
      }
      return sortDir === "asc" ? comparison : -comparison
    })
  }, [data, sortCol, sortDir])

  const isEmpty = !loading && data && data.length === 0

  return (
    <Card className="border-slate-800 bg-slate-900/60 shadow-sm flex flex-col">
      <CardHeader className="pb-3 border-b border-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-400" aria-hidden="true" />
            Model Comparison
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs mt-0.5">
            Resource efficiency, event throughput, and financial cost across LLMs
          </CardDescription>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="border-slate-700 font-mono text-[11px] text-slate-300"
          >
            {sortedData.length} models tracked
          </Badge>

          <div
            className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800"
            role="group"
            aria-label="Model statistics time range"
          >
            {(["24h", "7d", "30d"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                aria-pressed={range === r}
                className={`px-2.5 py-1 text-xs font-mono rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                  range === r
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex-1">
        {loading ? (
          <div
            className="h-[200px] p-2 flex flex-col justify-center"
            aria-label="Loading model comparison table"
          >
            <Skeleton variant="row" count={4} />
          </div>
        ) : error ? (
          <div className="h-[200px] flex flex-col items-center justify-center text-center p-6 border border-red-900/40 bg-red-950/20 rounded-lg">
            <p className="text-sm font-medium text-red-300">
              Failed to load model comparison
            </p>
            <p className="text-xs text-red-400/80 mt-1">{error.message}</p>
          </div>
        ) : isEmpty ? (
          <div className="h-[200px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-lg">
            <Layers className="h-8 w-8 text-slate-500 mb-2 opacity-50" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-300">
              No model telemetry recorded
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              No events were executed by any models in the selected {range} window.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              role="table"
              aria-label="Model comparison table"
              className="w-full text-left text-xs border-collapse"
            >
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  {/* 1. Model */}
                  <th
                    scope="col"
                    role="columnheader"
                    aria-sort={sortCol === "model" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                    className="py-2.5 px-3"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort("model")}
                      className="flex items-center gap-1.5 px-2 py-1 -ml-2 rounded hover:bg-slate-800/60 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400"
                    >
                      <span>Model</span>
                      <span aria-hidden="true" className="text-slate-500">
                        {sortCol === "model" ? (sortDir === "asc" ? "▲" : "▼") : <ArrowUpDown className="h-3 w-3" />}
                      </span>
                    </button>
                  </th>

                  {/* 2. Events */}
                  <th
                    scope="col"
                    role="columnheader"
                    aria-sort={sortCol === "events" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                    className="py-2.5 px-3 text-right"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort("events")}
                      className="flex items-center gap-1.5 ml-auto px-2 py-1 -mr-2 rounded hover:bg-slate-800/60 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400"
                    >
                      <span>Events</span>
                      <span aria-hidden="true" className="text-slate-500">
                        {sortCol === "events" ? (sortDir === "asc" ? "▲" : "▼") : <ArrowUpDown className="h-3 w-3" />}
                      </span>
                    </button>
                  </th>

                  {/* 3. Tokens */}
                  <th
                    scope="col"
                    role="columnheader"
                    aria-sort={sortCol === "tokens" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                    className="py-2.5 px-3 text-right"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort("tokens")}
                      className="flex items-center gap-1.5 ml-auto px-2 py-1 -mr-2 rounded hover:bg-slate-800/60 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400"
                    >
                      <span>Tokens</span>
                      <span aria-hidden="true" className="text-slate-500">
                        {sortCol === "tokens" ? (sortDir === "asc" ? "▲" : "▼") : <ArrowUpDown className="h-3 w-3" />}
                      </span>
                    </button>
                  </th>

                  {/* 4. Total Cost */}
                  <th
                    scope="col"
                    role="columnheader"
                    aria-sort={sortCol === "cost_usd" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                    className="py-2.5 px-3 text-right"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort("cost_usd")}
                      className="flex items-center gap-1.5 ml-auto px-2 py-1 -mr-2 rounded hover:bg-slate-800/60 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400"
                    >
                      <span>Total Cost</span>
                      <span aria-hidden="true" className="text-slate-500">
                        {sortCol === "cost_usd" ? (sortDir === "asc" ? "▲" : "▼") : <ArrowUpDown className="h-3 w-3" />}
                      </span>
                    </button>
                  </th>

                  {/* 5. Cost / 1M tokens */}
                  <th
                    scope="col"
                    role="columnheader"
                    aria-sort={sortCol === "cost_per_million" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                    className="py-2.5 px-3 text-right"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort("cost_per_million")}
                      className="flex items-center gap-1.5 ml-auto px-2 py-1 -mr-2 rounded hover:bg-slate-800/60 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400"
                    >
                      <span>Cost / 1M</span>
                      <span aria-hidden="true" className="text-slate-500">
                        {sortCol === "cost_per_million" ? (sortDir === "asc" ? "▲" : "▼") : <ArrowUpDown className="h-3 w-3" />}
                      </span>
                    </button>
                  </th>

                  {/* 6. Efficiency Bar */}
                  <th scope="col" role="columnheader" className="py-2.5 px-3 text-left">
                    <span>Efficiency</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {sortedData.map((row) => {
                  const efficiencyPct =
                    row.cost_per_million > 0
                      ? Math.min(100, Math.max(8, Math.round((minCostPerM / row.cost_per_million) * 100)))
                      : 100

                  return (
                    <motion.tr
                      key={row.model}
                      layout={!prefersReduced}
                      transition={{ duration: DURATION.normal, ease: EASING.enter }}
                      className="border-b border-slate-800/60 even:bg-slate-900/40 hover:bg-slate-800/40 transition-colors font-mono"
                    >
                      {/* Model Name */}
                      <td className="py-2.5 px-3 font-semibold text-slate-200">
                        {row.model}
                      </td>

                      {/* Events */}
                      <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                        {row.events.toLocaleString()}
                      </td>

                      {/* Tokens */}
                      <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">
                        {formatTokens(row.tokens)}
                      </td>

                      {/* Total Cost */}
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold tabular-nums">
                        {formatUsd(row.cost_usd)}
                      </td>

                      {/* Cost / 1M tokens */}
                      <td className="py-2.5 px-3 text-right text-purple-400 font-semibold tabular-nums">
                        {formatUsd(row.cost_per_million)}
                      </td>

                      {/* Efficiency Bar (Inverse Cost, cheapest = widest bar) */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 sm:w-28 h-2 rounded-full bg-slate-800 overflow-hidden relative">
                            <div
                              className="h-full rounded-full bg-chart-cache transition-[width] duration-500 ease-out"
                              style={{ width: `${efficiencyPct}%` }}
                              aria-hidden="true"
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 min-w-[28px] tabular-nums">
                            {efficiencyPct}%
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
