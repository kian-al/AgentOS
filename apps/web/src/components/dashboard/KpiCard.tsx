"use client"

import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { DeltaInfo } from "@/lib/format"
import { cn } from "@/lib/utils"
import { scaleIn, DURATION, EASING } from "@/lib/animations"
import { useReducedMotion } from "@/hooks/useReducedMotion"

export interface KpiCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  delta?: DeltaInfo | null
  deltaLabel?: string
  isLive?: boolean
  loading?: boolean
  sparklineData?: number[]
  sparklineColor?: "input" | "cost" | "session" | "agent" | "tool"
  className?: string
}

function MiniSparkline({
  data,
  color = "input",
}: {
  data: number[]
  color?: "input" | "cost" | "session" | "agent" | "tool"
}) {
  const colorClasses: Record<string, string> = {
    input: "text-chart-input",
    cost: "text-chart-cost",
    session: "text-chart-session",
    agent: "text-chart-agent",
    tool: "text-chart-tool",
  }

  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 64
  const height = 22
  const padding = 2

  const points = data
    .map((val, idx) => {
      const x = padding + (idx / (data.length - 1)) * (width - padding * 2)
      const y = height - padding - ((val - min) / range) * (height - padding * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")

  return (
    <div className={cn("shrink-0", colorClasses[color] || colorClasses.input)}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
        aria-hidden="true"
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  )
}

export function KpiCard({
  title,
  value,
  icon,
  delta,
  deltaLabel,
  isLive = false,
  loading = false,
  sparklineData,
  sparklineColor = "input",
  className,
}: KpiCardProps) {
  const prefersReduced = useReducedMotion()

  const deltaColorClasses = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    slate: "bg-slate-800 text-slate-400 border-slate-700/50",
  }

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-slate-800/80 bg-slate-900/60 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-700 min-h-[142px]",
        className
      )}
    >
      <CardContent className="p-5 flex flex-col justify-between h-full">
        {/* Header: Title + Icon */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 select-none">
            {title}
          </span>
          <div className="text-slate-400 p-1.5 rounded-lg bg-slate-800/50 border border-slate-700/40 shrink-0">
            {icon}
          </div>
        </div>

        {/* Value + Sparkline */}
        <div className="my-2 flex items-baseline justify-between gap-2">
          {loading ? (
            <div
              className="h-9 w-28 bg-slate-800/80 rounded animate-pulse my-0.5"
              aria-label="Loading metric value"
            />
          ) : (
            <motion.div
              key={String(value)}
              initial={prefersReduced ? false : { opacity: 0.7, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.fast, ease: EASING.enter }}
              className="text-3xl font-bold font-mono tracking-tight text-white tabular-nums"
            >
              {value}
            </motion.div>
          )}

          {!loading && sparklineData && sparklineData.length > 1 && (
            <MiniSparkline data={sparklineData} color={sparklineColor} />
          )}
        </div>

        {/* Footer: Delta or Live Status + Subtitle */}
        <div className="flex items-center gap-2 text-xs">
          {loading ? (
            <div className="h-4 w-32 bg-slate-800/60 rounded animate-pulse" />
          ) : (
            <>
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  live
                </span>
              ) : delta ? (
                <motion.span
                  variants={prefersReduced ? undefined : scaleIn}
                  initial="hidden"
                  animate="visible"
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium border",
                    deltaColorClasses[delta.color] || deltaColorClasses.slate
                  )}
                >
                  <span aria-hidden="true">
                    {delta.direction === "up" ? "▲" : delta.direction === "down" ? "▼" : "—"}
                  </span>
                  <span>{delta.text.replace(/^[▲▼—]\s*/, "")}</span>
                  <span className="sr-only">
                    {delta.direction === "up"
                      ? `increased by ${delta.text.replace(/^[▲▼—]\s*/, "")}`
                      : delta.direction === "down"
                      ? `decreased by ${delta.text.replace(/^[▲▼—]\s*/, "")}`
                      : "no change"}
                  </span>
                </motion.span>
              ) : null}

              {deltaLabel && (
                <span className="text-slate-400 select-none">{deltaLabel}</span>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
