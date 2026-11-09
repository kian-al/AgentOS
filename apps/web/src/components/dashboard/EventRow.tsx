"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BeaconEvent } from "@/lib/api"
import { getEventCategory } from "@/lib/eventTypes"
import { formatTokens, formatUsd } from "@/lib/format"
import { cn } from "@/lib/utils"
import { slideUp, DURATION } from "@/lib/animations"
import { useReducedMotion } from "@/hooks/useReducedMotion"

interface EventRowProps {
  event: BeaconEvent
  onSelect: (event: BeaconEvent) => void
  animateEntrance?: boolean
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return "—"
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  } catch {
    return "—"
  }
}

function getRelativeTime(iso: string): string {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ""
    const now = Date.now()
    const diffSec = Math.max(0, Math.floor((now - d.getTime()) / 1000))
    if (diffSec < 5) return "just now"
    if (diffSec < 60) return `${diffSec}s ago`
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    return `${Math.floor(diffSec / 3600)}h ago`
  } catch {
    return ""
  }
}

const CATEGORY_DOT_GLOW: Record<string, string> = {
  TOOL: "bg-chart-tool shadow-[0_0_6px_var(--chart-tool)]",
  AGENT: "bg-chart-agent shadow-[0_0_6px_var(--chart-agent)]",
  SESSION: "bg-chart-session shadow-[0_0_6px_var(--chart-session)]",
  ERROR: "bg-chart-error shadow-[0_0_6px_var(--chart-error)]",
  METRIC: "bg-chart-input shadow-[0_0_6px_var(--chart-input)]",
}

export function EventRow({
  event,
  onSelect,
  animateEntrance = false,
}: EventRowProps) {
  const prefersReduced = useReducedMotion()
  const categoryInfo = getEventCategory(event)
  const timeStr = formatTime(event.timestamp || event.created_at)
  const [relativeTime, setRelativeTime] = useState<string>(() =>
    getRelativeTime(event.timestamp || event.created_at)
  )

  useEffect(() => {
    const id = setInterval(() => {
      setRelativeTime(getRelativeTime(event.timestamp || event.created_at))
    }, 15000)
    return () => clearInterval(id)
  }, [event.timestamp, event.created_at])

  const totalTokens = (event.input_tokens || 0) + (event.output_tokens || 0)
  const shortModel = event.model ? event.model.replace(/^claude-/, "") : "—"
  const toolName = event.tool_name || "—"
  const agentName = event.agent || "—"
  const dotGlowClass = CATEGORY_DOT_GLOW[categoryInfo.label] || "bg-slate-400"

  const shouldAnimate = animateEntrance && !prefersReduced

  return (
    <motion.article
      role="article"
      aria-label={`Open details for event ${event.id || "live"}: ${categoryInfo.label} by ${agentName} at ${timeStr}`}
      tabIndex={0}
      variants={shouldAnimate ? slideUp : undefined}
      initial={shouldAnimate ? "hidden" : undefined}
      animate={shouldAnimate ? "visible" : undefined}
      transition={{ duration: DURATION.fast }}
      onClick={() => onSelect(event)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect(event)
        }
      }}
      className="group grid grid-cols-12 items-center gap-2 px-3 py-2 text-xs border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
    >
      {/* 1. Time + Relative (col 2) */}
      <div className="col-span-2 flex flex-col justify-center">
        <span className="font-mono text-slate-300 group-hover:text-white leading-tight">
          {timeStr}
        </span>
        {relativeTime && (
          <span className="font-mono text-[10px] text-slate-500 leading-tight">
            {relativeTime}
          </span>
        )}
      </div>

      {/* 2. Type Badge with glowing dot (col 2) */}
      <div className="col-span-2 flex items-center">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border",
            categoryInfo.badgeClass
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotGlowClass)} aria-hidden="true" />
          <span>{categoryInfo.label}</span>
        </span>
      </div>

      {/* 3. Agent (col 3) */}
      <span className="col-span-3 font-mono text-slate-300 truncate" title={agentName}>
        {agentName}
      </span>

      {/* 4. Model (col 2) */}
      <span className="col-span-2 font-mono text-slate-400 truncate" title={event.model || ""}>
        {shortModel}
      </span>

      {/* 5. Tool Name (col 1) */}
      <span className="col-span-1 font-mono text-slate-300 truncate" title={toolName}>
        {toolName}
      </span>

      {/* 6. Tokens & Cost (col 2) */}
      <div className="col-span-2 flex items-center justify-end gap-2 text-right font-mono tabular-nums">
        <span className="text-slate-400">
          {totalTokens > 0 ? formatTokens(totalTokens) : "—"}
        </span>
        <span className="text-emerald-400 font-semibold min-w-[42px]">
          {event.cost_usd > 0 ? formatUsd(event.cost_usd) : "—"}
        </span>
      </div>
    </motion.article>
  )
}
