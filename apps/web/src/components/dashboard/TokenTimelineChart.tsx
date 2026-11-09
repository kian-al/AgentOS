"use client"

import React, { useState, useEffect } from "react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RangeToggle } from "@/components/dashboard/RangeToggle"
import { useTimeline } from "@/hooks/useTimeline"
import { formatTokens, formatUsd } from "@/lib/format"
import { Activity, BarChart3 } from "lucide-react"
import { TimelineBucket } from "@/lib/api"
import { useChartColors } from "@/lib/chartColors"

function formatBucketLabel(
  iso: string,
  formatType: "axis" | "full" = "axis",
  rangeKey = "24h"
): string {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso

    if (formatType === "full") {
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    }

    if (rangeKey === "24h") {
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    }

    if (rangeKey === "7d") {
      return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${d.toLocaleTimeString("en-US", { hour: "2-digit", hour12: false })}h`
    }

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  } catch {
    return iso
  }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
    payload: TimelineBucket
  }>
  label?: string
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null
  const bucket = payload[0]?.payload
  if (!bucket) return null

  const formattedDate = formatBucketLabel(bucket.bucket, "full")
  const totalTokens =
    bucket.input_tokens + bucket.output_tokens + bucket.cache_read_tokens

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/95 p-3 shadow-xl backdrop-blur text-xs min-w-[200px]">
      <div className="font-semibold text-slate-200 border-b border-slate-800/80 pb-1.5 mb-2 flex items-center justify-between">
        <span>{formattedDate}</span>
        <span className="font-mono text-emerald-400">
          {formatUsd(bucket.cost_usd)}
        </span>
      </div>
      <div className="space-y-1.5 font-mono">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-blue-400">
            <span className="h-2 w-2 rounded-full bg-chart-input inline-block" />
            Input:
          </span>
          <span className="text-slate-200">
            {formatTokens(bucket.input_tokens)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-purple-400">
            <span className="h-2 w-2 rounded-full bg-chart-output inline-block" />
            Output:
          </span>
          <span className="text-slate-200">
            {formatTokens(bucket.output_tokens)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-chart-cache inline-block" />
            Cache Read:
          </span>
          <span className="text-slate-200">
            {formatTokens(bucket.cache_read_tokens)}
          </span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 font-bold">
          <span className="text-slate-300">Total:</span>
          <span className="text-white">{formatTokens(totalTokens)}</span>
        </div>
      </div>
    </div>
  )
}

export function TokenTimelineChart() {
  const { data, loading, error, range } = useTimeline()
  const colors = useChartColors()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Card className="border-slate-800 bg-slate-900/60 shadow-sm backdrop-blur">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3 border-b border-slate-800/70">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-400" aria-hidden="true" />
          <CardTitle className="text-base font-semibold text-white tracking-tight">
            Token Usage Timeline
          </CardTitle>
        </div>
        <RangeToggle />
      </CardHeader>
      <CardContent className="pt-5">
        {!mounted || loading ? (
          <div
            className="h-[280px] w-full flex flex-col justify-end gap-3 p-4 bg-slate-900/40 rounded-lg animate-pulse"
            aria-label="Loading token usage chart"
          >
            <div className="h-full w-full bg-slate-800/30 rounded" />
            <div className="h-4 w-full bg-slate-800/50 rounded" />
          </div>
        ) : error ? (
          <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 border border-red-900/40 bg-red-950/20 rounded-lg">
            <p className="text-sm font-medium text-red-300">
              Failed to load token timeline
            </p>
            <p className="text-xs text-red-400/80 mt-1">{error.message}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-lg">
            <Activity className="h-8 w-8 text-slate-500 mb-2 opacity-50" />
            <p className="text-sm font-medium text-slate-300">
              No token activity recorded
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              No telemetry events with token usage were recorded in the selected{" "}
              {range} window.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="fillInput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.input} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={colors.input} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="fillOutput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.output} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={colors.output} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="fillCache" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.cache} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={colors.cache} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="bucket"
                    tickFormatter={(val) =>
                      formatBucketLabel(val, "axis", range)
                    }
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    tickLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    tickFormatter={(val) => formatTokens(val)}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    tickLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="cache_read_tokens"
                    stackId="1"
                    stroke={colors.cache}
                    strokeWidth={1.5}
                    fill="url(#fillCache)"
                    name="Cache Read"
                  />
                  <Area
                    type="monotone"
                    dataKey="input_tokens"
                    stackId="1"
                    stroke={colors.input}
                    strokeWidth={1.5}
                    fill="url(#fillInput)"
                    name="Input"
                  />
                  <Area
                    type="monotone"
                    dataKey="output_tokens"
                    stackId="1"
                    stroke={colors.output}
                    strokeWidth={1.5}
                    fill="url(#fillOutput)"
                    name="Output"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-800/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-chart-input" />
                <span className="text-slate-300 font-medium">Input Tokens</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-chart-output" />
                <span className="text-slate-300 font-medium">Output Tokens</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-chart-cache" />
                <span className="text-slate-300 font-medium">Cache Read</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
