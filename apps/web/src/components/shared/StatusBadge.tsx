"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { useHealthCheck } from "@/hooks/useHealthCheck"

interface StatusBadgeProps {
  className?: string
  intervalMs?: number
}

/**
 * StatusBadge renders the Beacon connection status badge:
 * 🟢 Beacon (Online) or 🔴 Beacon (Disconnected).
 * Employs useHealthCheck hook to poll /api/health every 10s.
 */
export function StatusBadge({ className, intervalMs = 10000 }: StatusBadgeProps) {
  const { isOnline, version } = useHealthCheck(intervalMs)

  return (
    <div
      className={`flex items-center gap-2 ${className || ""}`}
      role="status"
      aria-live="polite"
      aria-label={`Beacon Status: ${isOnline ? "Online" : "Disconnected"}`}
    >
      <Badge
        variant={isOnline ? "success" : "destructive"}
        className="flex items-center gap-1.5 px-2.5 py-1 font-mono text-xs cursor-default select-none transition-all duration-150 border"
      >
        <span
          className={`h-2 w-2 rounded-full shrink-0 ${
            isOnline
              ? "bg-emerald-400 motion-safe:animate-pulse motion-reduce:animate-none"
              : "bg-red-500"
          }`}
          aria-hidden="true"
        />
        <span>{isOnline ? "🟢 Beacon" : "🔴 Beacon"}</span>
        <span className="sr-only">
          {isOnline
            ? "Beacon backend service is healthy and online"
            : "Beacon backend service is offline"}
        </span>
      </Badge>
      <span
        className="text-[11px] text-slate-400 dark:text-slate-500 font-mono hidden sm:inline"
        aria-label={`Version ${version}`}
      >
        v{version}
      </span>
    </div>
  )
}

