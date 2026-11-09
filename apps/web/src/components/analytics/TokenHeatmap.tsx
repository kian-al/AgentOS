"use client"

import React, { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useHeatmap, HeatmapRange } from "@/hooks/useHeatmap"
import { HeatmapDay } from "@/lib/api"
import { formatTokens } from "@/lib/format"
import { Calendar, Flame } from "lucide-react"
import { Skeleton } from "@/components/shared/Skeleton"
import { useReducedMotion } from "@/hooks/useReducedMotion"

interface TokenHeatmapProps {
  initialRange?: HeatmapRange
  overrideData?: HeatmapDay[]
}

interface DayCellData {
  day: string
  tokens: number
  dateObj: Date
}

function formatDateISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function TokenHeatmap({ initialRange = "90d", overrideData }: TokenHeatmapProps) {
  const { data: hookData, loading, error, range, setRange } = useHeatmap(initialRange)
  const data = overrideData ?? hookData
  const [hoveredCell, setHoveredCell] = useState<DayCellData | null>(null)
  const prefersReduced = useReducedMotion()

  const numDays = range === "180d" ? 180 : 90

  // 1. Generate full list of days in the window (ending today)
  const daysList = useMemo(() => {
    const list: DayCellData[] = []
    const dataMap = new Map<string, number>()
    if (data && Array.isArray(data)) {
      for (const d of data) {
        dataMap.set(d.day, d.tokens)
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dateStr = formatDateISO(d)
      list.push({
        day: dateStr,
        tokens: dataMap.get(dateStr) ?? 0,
        dateObj: d,
      })
    }

    return list
  }, [data, numDays])

  // 2. Compute non-zero token percentiles for intensity categorization
  const { p25, p50, p75 } = useMemo(() => {
    const nonZero = daysList
      .map((d) => d.tokens)
      .filter((t) => t > 0)
      .sort((a, b) => a - b)

    if (nonZero.length === 0) {
      return { p25: 1, p50: 2, p75: 3 }
    }

    return {
      p25: nonZero[Math.floor(nonZero.length * 0.25)] ?? 1,
      p50: nonZero[Math.floor(nonZero.length * 0.5)] ?? 2,
      p75: nonZero[Math.floor(nonZero.length * 0.75)] ?? 3,
    }
  }, [daysList])

  // 3. Static Tailwind intensity class mapping
  const getIntensityClass = (tokens: number): string => {
    if (tokens === 0) return "bg-slate-800"
    if (tokens < p25) return "bg-chart-input/30"
    if (tokens < p50) return "bg-chart-input/55"
    if (tokens < p75) return "bg-chart-input/80"
    return "bg-chart-input"
  }

  // 4. Month labels extraction (aligned by week column)
  const monthLabels = useMemo(() => {
    const months: { label: string; colIndex: number }[] = []
    let lastMonth = -1

    daysList.forEach((item, index) => {
      const colIndex = Math.floor(index / 7)
      const m = item.dateObj.getMonth()
      if (m !== lastMonth) {
        lastMonth = m
        months.push({
          label: item.dateObj.toLocaleString("en-US", { month: "short" }),
          colIndex,
        })
      }
    })

    return months
  }, [daysList])

  // 5. Total tokens in window
  const totalTokens = useMemo(() => {
    return daysList.reduce((acc, curr) => acc + curr.tokens, 0)
  }, [daysList])

  const isEmpty = !loading && data && data.length === 0

  return (
    <Card className="border-slate-800 bg-slate-900/60 shadow-sm flex flex-col">
      <CardHeader className="pb-3 border-b border-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base text-white flex items-center gap-2">
            <Flame className="h-4 w-4 text-blue-400" aria-hidden="true" />
            Token Heatmap Calendar
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs mt-0.5">
            Daily token volume and activity density over time
          </CardDescription>
        </div>

        {/* Range Toggle & KPI Summary */}
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="border-slate-700 font-mono text-[11px] text-slate-300"
          >
            {formatTokens(totalTokens)} tokens total
          </Badge>

          <div
            className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800"
            role="group"
            aria-label="Heatmap time range"
          >
            {(["90d", "180d"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                aria-pressed={range === r}
                className={`px-2.5 py-1 text-xs font-mono rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  range === r
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex-1 flex flex-col justify-between">
        {loading ? (
          <div
            className="h-[180px] p-2 flex flex-col justify-center"
            aria-label="Loading token heatmap"
          >
            <Skeleton variant="chart" />
          </div>
        ) : error ? (
          <div className="h-[180px] flex flex-col items-center justify-center text-center p-6 border border-red-900/40 bg-red-950/20 rounded-lg">
            <p className="text-sm font-medium text-red-300">
              Failed to load heatmap data
            </p>
            <p className="text-xs text-red-400/80 mt-1">{error.message}</p>
          </div>
        ) : isEmpty ? (
          <div className="h-[180px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-lg">
            <Calendar className="h-8 w-8 text-slate-500 mb-2 opacity-50" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-300">
              No token telemetry recorded
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              No token usage events exist in the selected {range} window.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Active Cell Tooltip Indicator */}
            <div className="h-5 flex items-center justify-between text-[11px] font-mono text-slate-400">
              {hoveredCell ? (
                <span className="text-slate-200 font-medium">
                  {hoveredCell.day}:{" "}
                  <strong className="text-blue-400 font-bold">
                    {formatTokens(hoveredCell.tokens)} tokens
                  </strong>
                </span>
              ) : (
                <span className="text-slate-500">
                  Hover or focus a day cell to inspect usage
                </span>
              )}
            </div>

            {/* Heatmap Grid Container */}
            <div className="overflow-x-auto pb-2">
              <div className="inline-block min-w-full">
                {/* Month Column Headers */}
                <div
                  className="flex gap-1.5 text-[10px] font-mono text-slate-400 pl-7 mb-1"
                  aria-hidden="true"
                >
                  {monthLabels.map((m, idx) => (
                    <span
                      key={`${m.label}-${idx}`}
                      className="inline-block"
                      style={{ minWidth: "3.5rem" }}
                    >
                      {m.label}
                    </span>
                  ))}
                </div>

                {/* Grid with Day of Week Axis */}
                <div className="flex gap-2 items-center">
                  {/* Day Axis Labels */}
                  <div
                    className="flex flex-col justify-between h-[106px] text-[10px] font-mono text-slate-500 shrink-0 select-none"
                    aria-hidden="true"
                  >
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Fri</span>
                  </div>

                  {/* 7-row calendar grid */}
                  <div
                    role="grid"
                    aria-label="Token usage heatmap"
                    className="grid grid-flow-col grid-rows-7 gap-1 sm:gap-1.5"
                  >
                    {daysList.map((dayItem, index) => {
                      const intensityClass = getIntensityClass(dayItem.tokens)
                      const isHovered = hoveredCell?.day === dayItem.day
                      const colIndex = Math.floor(index / 7)

                      return (
                        <motion.div
                          key={dayItem.day}
                          role="gridcell"
                          tabIndex={0}
                          aria-label={`${dayItem.day}: ${dayItem.tokens.toLocaleString()} tokens`}
                          initial={prefersReduced ? false : { opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={
                            prefersReduced
                              ? { duration: 0 }
                              : { duration: 0.15, delay: colIndex * 0.01 }
                          }
                          onMouseEnter={() => setHoveredCell(dayItem)}
                          onMouseLeave={() => setHoveredCell(null)}
                          onFocus={() => setHoveredCell(dayItem)}
                          onBlur={() => setHoveredCell(null)}
                          className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm transition-all cursor-pointer ${intensityClass} ${
                            isHovered
                              ? "ring-2 ring-white ring-offset-1 ring-offset-slate-950 scale-125 z-10"
                              : "hover:scale-110"
                          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
              <span className="text-slate-500">
                Click a cell to filter session telemetry
              </span>

              <div
                className="flex items-center gap-1.5"
                role="region"
                aria-label="Color intensity legend"
              >
                <span>Less</span>
                <span
                  className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700/50"
                  aria-label="0 tokens"
                />
                <span
                  className="w-2.5 h-2.5 rounded-sm bg-chart-input/30"
                  aria-label="Low volume (<25th percentile)"
                />
                <span
                  className="w-2.5 h-2.5 rounded-sm bg-chart-input/55"
                  aria-label="Medium volume (25th-50th percentile)"
                />
                <span
                  className="w-2.5 h-2.5 rounded-sm bg-chart-input/80"
                  aria-label="High volume (50th-75th percentile)"
                />
                <span
                  className="w-2.5 h-2.5 rounded-sm bg-chart-input"
                  aria-label="Peak volume (>75th percentile)"
                />
                <span>More</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
