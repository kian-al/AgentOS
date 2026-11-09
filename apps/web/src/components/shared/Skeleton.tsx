import React from "react"
import { cn } from "@/lib/utils"

export type SkeletonVariant = "card" | "row" | "chart" | "text"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant
  className?: string
  count?: number
}

export function Skeleton({
  variant = "text",
  className,
  count = 1,
  ...props
}: SkeletonProps) {
  const renderItem = (key: number) => {
    switch (variant) {
      case "card":
        return (
          <div
            key={key}
            data-testid="skeleton-card"
            aria-hidden="true"
            className={cn(
              "rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-3",
              className
            )}
            {...props}
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-slate-800 animate-pulse" />
              <div className="h-6 w-6 rounded-full bg-slate-800 animate-pulse" />
            </div>
            <div className="h-8 w-36 rounded bg-slate-800 animate-pulse" />
            <div className="h-3 w-28 rounded bg-slate-800 animate-pulse" />
          </div>
        )
      case "row":
        return (
          <div
            key={key}
            data-testid="skeleton-row"
            aria-hidden="true"
            className={cn(
              "flex items-center justify-between gap-4 py-3 px-4 border-b border-slate-800/60 bg-slate-900/30",
              className
            )}
            {...props}
          >
            <div className="flex items-center gap-3 w-1/3">
              <div className="h-3.5 w-3.5 rounded-full bg-slate-800 animate-pulse" />
              <div className="h-4 w-28 rounded bg-slate-800 animate-pulse" />
            </div>
            <div className="h-4 w-20 rounded bg-slate-800 animate-pulse" />
            <div className="h-4 w-16 rounded bg-slate-800 animate-pulse" />
            <div className="h-4 w-24 rounded bg-slate-800 animate-pulse" />
          </div>
        )
      case "chart":
        return (
          <div
            key={key}
            data-testid="skeleton-chart"
            aria-hidden="true"
            className={cn(
              "rounded-lg border border-slate-800 bg-slate-900/60 p-5 space-y-4",
              className
            )}
            {...props}
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 rounded bg-slate-800 animate-pulse" />
              <div className="h-4 w-16 rounded bg-slate-800 animate-pulse" />
            </div>
            <div className="h-48 w-full rounded-md bg-slate-800/80 animate-pulse flex items-end gap-2 p-4">
              <div className="h-1/3 w-full rounded bg-slate-700/60 animate-pulse" />
              <div className="h-2/3 w-full rounded bg-slate-700/60 animate-pulse" />
              <div className="h-1/2 w-full rounded bg-slate-700/60 animate-pulse" />
              <div className="h-5/6 w-full rounded bg-slate-700/60 animate-pulse" />
              <div className="h-3/4 w-full rounded bg-slate-700/60 animate-pulse" />
            </div>
          </div>
        )
      case "text":
      default:
        return (
          <div
            key={key}
            data-testid="skeleton-text"
            aria-hidden="true"
            className={cn(
              "h-4 w-full rounded bg-slate-800 animate-pulse",
              className
            )}
            {...props}
          />
        )
    }
  }

  if (count > 1) {
    return (
      <div className="space-y-2 w-full" aria-busy="true" aria-live="polite">
        {Array.from({ length: count }, (_, i) => renderItem(i))}
      </div>
    )
  }

  return (
    <div className="w-full" aria-busy="true" aria-live="polite">
      {renderItem(0)}
    </div>
  )
}

