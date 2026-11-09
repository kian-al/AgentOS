"use client"

import React from "react"
import { motion } from "framer-motion"
import { useRangeStore, TimeRange } from "@/store/rangeStore"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"

const RANGES: { id: TimeRange; label: string }[] = [
  { id: "24h", label: "24h" },
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
]

export function RangeToggle({ className }: { className?: string }) {
  const { range, setRange } = useRangeStore()
  const prefersReduced = useReducedMotion()

  return (
    <div
      role="group"
      aria-label="Timeline range filter"
      className={cn(
        "inline-flex items-center rounded-lg border border-slate-800 bg-slate-900/80 p-0.5 backdrop-blur",
        className
      )}
    >
      {RANGES.map((r) => {
        const isActive = range === r.id
        return (
          <button
            key={r.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => setRange(r.id)}
            className={cn(
              "relative px-3 py-1 text-xs font-medium rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 select-none",
              isActive
                ? "text-white font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            )}
          >
            {isActive && !prefersReduced && (
              <motion.div
                layoutId="range-active-pill"
                className="absolute inset-0 rounded-md bg-blue-600 shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                aria-hidden="true"
              />
            )}
            {isActive && prefersReduced && (
              <div
                className="absolute inset-0 rounded-md bg-blue-600 shadow-sm"
                aria-hidden="true"
              />
            )}
            <span className="relative z-10">{r.label}</span>
          </button>
        )
      })}
    </div>
  )
}
