"use client"

import React, { useMemo } from "react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts"
import { SessionEvent } from "@/lib/api"
import { formatTokens } from "@/lib/format"
import { useChartColors } from "@/lib/chartColors"

interface SessionEventChartProps {
  events: SessionEvent[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
    dataKey: string
  }>
  label?: string
}

function EventChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  const totalTokens = payload.reduce((acc, curr) => acc + (curr.value || 0), 0)

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/95 p-2.5 shadow-xl backdrop-blur text-xs min-w-[150px] font-mono">
      <div className="font-semibold text-slate-300 border-b border-slate-800/80 pb-1 mb-1.5 flex justify-between">
        <span>Event {label}</span>
        <span className="text-white font-bold">{formatTokens(totalTokens)}</span>
      </div>
      {payload.map((item) => (
        <div key={item.dataKey} className="flex items-center justify-between gap-3 text-[11px]">
          <span className="text-slate-400 capitalize">{item.name}:</span>
          <span className="font-semibold text-slate-200">
            {formatTokens(item.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function SessionEventChart({ events }: SessionEventChartProps) {
  const chartColors = useChartColors()

  const data = useMemo(() => {
    return events.map((ev, index) => {
      const toolOrType = ev.tool_name ? ev.tool_name : ev.event_type
      return {
        id: ev.id,
        index: index + 1,
        label: `#${index + 1} ${toolOrType}`,
        input: ev.token_usage_input,
        output: ev.token_usage_output,
        cache: ev.token_usage_cache_read,
        cost: ev.cost_usd,
      }
    })
  }, [events])

  if (!events || events.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-xs text-slate-500 font-mono border border-dashed border-slate-800 rounded-lg">
        No token events recorded for chart
      </div>
    )
  }

  // Calculate dynamic chart height based on count of events (min 180px, up to 360px)
  const chartHeight = Math.max(180, Math.min(360, events.length * 28 + 60))

  return (
    <div className="w-full bg-slate-950/40 border border-slate-800/80 rounded-lg p-3">
      <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
        <span>Token Composition Per Event</span>
        <span className="text-[11px] text-slate-500 font-normal">
          Input / Output / Cache breakdown
        </span>
      </div>

      <div style={{ width: "100%", height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-slate-800/60"
              horizontal={false}
            />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "currentColor", fontSize: 10 }}
              className="text-slate-400 font-mono"
              tickFormatter={(v) => formatTokens(v)}
            />
            <YAxis
              type="category"
              dataKey="label"
              tickLine={false}
              axisLine={false}
              width={100}
              tick={{ fill: "currentColor", fontSize: 10 }}
              className="text-slate-400 font-mono"
            />
            <Tooltip content={<EventChartTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 6, fontSize: 11 }}
              iconType="circle"
              iconSize={7}
            />
            <Bar
              dataKey="input"
              name="Input"
              stackId="tokens"
              fill={chartColors.input || "var(--chart-input)"}
              isAnimationActive={false}
            />
            <Bar
              dataKey="output"
              name="Output"
              stackId="tokens"
              fill={chartColors.output || "var(--chart-output)"}
              isAnimationActive={false}
            />
            <Bar
              dataKey="cache"
              name="Cache"
              stackId="tokens"
              fill={chartColors.cache || "var(--chart-cache)"}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

