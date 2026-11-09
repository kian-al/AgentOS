"use client"

import React, { useMemo } from "react"
import { motion } from "framer-motion"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useProjection } from "@/hooks/useProjection"
import { ProjectionResult } from "@/lib/api"
import { formatTokens, formatUsd } from "@/lib/format"
import { useChartColors } from "@/lib/chartColors"
import { TrendingUp, Calendar, AlertCircle } from "lucide-react"
import { slideUp, scaleIn } from "@/lib/animations"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { Skeleton } from "@/components/shared/Skeleton"

interface CostProjectionWidgetProps {
  overrideData?: ProjectionResult
}

export const CONFIDENCE_STYLES = {
  low: "bg-chart-error/20 text-chart-error border-chart-error/30",
  medium: "bg-chart-tool/20 text-chart-tool border-chart-tool/30",
  high: "bg-chart-cache/20 text-chart-cache border-chart-cache/30",
} as const

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    dataKey: string
    color: string
  }>
  label?: string
}

function ProjectionTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/95 p-2.5 shadow-xl backdrop-blur text-xs min-w-[140px] font-mono">
      <div className="font-semibold text-slate-300 border-b border-slate-800/80 pb-1 mb-1.5">
        {label}
      </div>
      {payload.map((item) => (
        <div key={item.dataKey} className="flex items-center justify-between gap-3">
          <span className="text-slate-400 capitalize">{item.name}:</span>
          <span className="font-semibold text-white">
            {typeof item.value === "number" ? formatUsd(item.value) : item.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function CostProjectionWidget({ overrideData }: CostProjectionWidgetProps) {
  const { data: hookData, loading, error } = useProjection()
  const data = overrideData ?? hookData
  const chartColors = useChartColors()
  const prefersReduced = useReducedMotion()

  // Prepare chart series: 30 actual daily dots + dashed projection line to end of month
  const chartSeries = useMemo(() => {
    if (!data || !data.history || data.history.length === 0) return []

    const history = data.history
    const lastPoint = history[history.length - 1]
    const lastDate = new Date(lastPoint.date)

    // Historical points with actual cost
    const series: Array<{
      date: string
      displayDate: string
      actual: number | null
      projected: number | null
    }> = history.map((pt) => {
      const d = new Date(pt.date)
      const display = isNaN(d.getTime())
        ? pt.date
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      return {
        date: pt.date,
        displayDate: display,
        actual: pt.cost_usd,
        projected: null,
      }
    })

    // Connect the last actual point to the projected line
    series[series.length - 1].projected = lastPoint.cost_usd

    // Determine end of current month
    const endOfMonth = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0)
    const remainingDays = Math.max(1, Math.min(25, endOfMonth.getDate() - lastDate.getDate()))

    // Extrapolate slope for remaining days in month
    let runningCost = lastPoint.cost_usd
    for (let i = 1; i <= remainingDays; i++) {
      const futureDate = new Date(lastDate)
      futureDate.setDate(lastDate.getDate() + i)
      const iso = futureDate.toISOString().split("T")[0]
      const display = futureDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      runningCost = Math.max(0, runningCost + data.trend_slope)

      series.push({
        date: iso,
        displayDate: display,
        actual: null,
        projected: runningCost,
      })
    }

    return series
  }, [data])

  if (loading) {
    return (
      <Card
        className="border-slate-800 bg-slate-900/60 shadow-sm p-6"
        aria-label="Loading cost projection"
      >
        <Skeleton variant="chart" />
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-900/40 bg-red-950/20 p-6">
        <div className="flex items-center gap-3 text-red-300">
          <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          <div>
            <h4 className="text-sm font-semibold">Cost Projection Unavailable</h4>
            <p className="text-xs text-red-400/80 mt-0.5">{error.message}</p>
          </div>
        </div>
      </Card>
    )
  }

  // Story requirement: If data_points < 3 show EmptyState
  if (!data || data.data_points < 3) {
    return (
      <Card className="border-slate-800 bg-slate-900/60 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col items-center justify-center text-center py-4">
          <div className="p-3 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-400 mb-3">
            <Calendar className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Cost Projection
          </h3>
          <p className="text-sm font-medium text-slate-300 mt-2 max-w-md">
            Not enough data for projection — check back after 3 days of usage.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Minimum 3 days of telemetry required to compute linear regression.
          </p>
        </div>
      </Card>
    )
  }

  const confidenceKey = data.confidence in CONFIDENCE_STYLES ? data.confidence : "medium"
  const confidenceClass = CONFIDENCE_STYLES[confidenceKey]
  const isPositiveSlope = data.trend_slope >= 0

  return (
    <Card className="border-slate-800 bg-slate-900/60 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            Cost Projection
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs mt-0.5">
            Forward-looking expenditure forecast derived from 30-day linear regression
          </CardDescription>
        </div>

        {/* Confidence Badge */}
        <motion.div
          variants={prefersReduced ? undefined : scaleIn}
          initial="hidden"
          animate="visible"
          className="flex items-center gap-2"
        >
          <span className="text-xs text-slate-400 font-medium">Confidence:</span>
          <Badge
            variant="outline"
            className={`font-mono text-xs uppercase tracking-wider font-semibold border ${confidenceClass}`}
          >
            {data.confidence}
          </Badge>
        </motion.div>
      </CardHeader>

      <CardContent className="pt-6">
        {/* Screen Reader Accessible Narrative */}
        <p className="sr-only">
          Projected monthly cost is {formatUsd(data.projected_month_usd)} with a{" "}
          {isPositiveSlope ? "positive" : "negative"} daily trend slope of $
          {data.trend_slope.toFixed(4)} and {data.confidence} confidence based on {data.data_points}{" "}
          days of recorded telemetry.
        </p>

        {/* Two-column Layout: Left = Big Number & Metrics, Right = Recharts LineChart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Big Number Display */}
          <div className="lg:col-span-4 flex flex-col justify-center space-y-4 border-b lg:border-b-0 lg:border-r border-slate-800/80 pb-6 lg:pb-0 lg:pr-6">
            <motion.div
              variants={prefersReduced ? undefined : slideUp}
              initial="hidden"
              animate="visible"
            >
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
                {formatUsd(data.projected_month_usd)}
              </div>
              <div className="text-xs uppercase tracking-wider font-medium text-slate-400 mt-1">
                projected this month
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">Daily avg</div>
                <div className="text-sm font-semibold font-mono text-slate-200 mt-0.5">
                  {formatUsd(data.daily_avg_usd)}
                  <span className="text-[11px] text-slate-400 font-normal">/day</span>
                </div>
              </div>

              <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">Trend slope</div>
                <div className="text-sm font-semibold font-mono text-slate-200 mt-0.5 flex items-center gap-1">
                  <span className={isPositiveSlope ? "text-rose-400" : "text-emerald-400"}>
                    {isPositiveSlope ? "+" : ""}
                    {data.trend_slope.toFixed(4)}
                  </span>
                  <span className="text-[10px] text-slate-400">/day</span>
                </div>
              </div>

              <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">Projected tokens</div>
                <div className="text-sm font-semibold font-mono text-slate-200 mt-0.5">
                  {formatTokens(data.projected_month_tokens)}
                </div>
              </div>

              <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">Sample window</div>
                <div className="text-sm font-semibold font-mono text-slate-200 mt-0.5">
                  {data.data_points} <span className="text-[11px] text-slate-400 font-normal">days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Recharts Line Chart */}
          <div className="lg:col-span-8 h-[240px] w-full min-w-0" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartSeries}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border) / 0.5)"
                  vertical={false}
                />
                <XAxis
                  dataKey="displayDate"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip content={<ProjectionTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="plainline"
                  wrapperStyle={{
                    fontSize: "11px",
                    fontFamily: "monospace",
                    paddingBottom: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual Cost"
                  stroke={chartColors.cost}
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: chartColors.cost }}
                  activeDot={{ r: 5, fill: chartColors.cost }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="projected"
                  name="Projected"
                  stroke={chartColors.input}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 4, fill: chartColors.input }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
