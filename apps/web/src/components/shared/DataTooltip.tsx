"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"

export interface TooltipItem {
  label: string
  value: string | number
  colorClass?: string
  indicatorClass?: string
}

export interface DataTooltipProps {
  content?: React.ReactNode
  label?: string
  subtext?: string
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
  className?: string
}

export function DataTooltip({
  content,
  label,
  subtext,
  children,
  side = "top",
  className,
}: DataTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      tabIndex={0}
    >
      {children}
      {isVisible && (label || content || subtext) && (
        <div
          role="tooltip"
          data-testid="data-tooltip"
          className={cn(
            "absolute z-50 pointer-events-none rounded-md border border-slate-800 bg-slate-950/95 px-2.5 py-1.5 shadow-xl backdrop-blur text-xs min-w-max animate-in fade-in zoom-in-95 duration-150",
            positionClasses[side],
            className
          )}
        >
          {label && (
            <div className="font-semibold text-slate-200">{label}</div>
          )}
          {content && (
            <div className="font-mono text-slate-300">{content}</div>
          )}
          {subtext && (
            <div className="text-[10px] text-slate-400 mt-0.5">{subtext}</div>
          )}
        </div>
      )}
    </div>
  )
}

export interface DataTooltipContentProps {
  title?: string
  badge?: React.ReactNode
  items?: TooltipItem[]
  footer?: React.ReactNode
  className?: string
}

export function DataTooltipContent({
  title,
  badge,
  items,
  footer,
  className,
}: DataTooltipContentProps) {
  return (
    <div
      data-testid="data-tooltip-content"
      className={cn(
        "rounded-lg border border-slate-800 bg-slate-950/95 p-3 shadow-xl backdrop-blur text-xs min-w-[200px]",
        className
      )}
    >
      {(title || badge) && (
        <div className="font-semibold text-slate-200 border-b border-slate-800/80 pb-1.5 mb-2 flex items-center justify-between gap-3">
          {title && <span>{title}</span>}
          {badge && <span className="font-mono">{badge}</span>}
        </div>
      )}
      {items && items.length > 0 && (
        <div className="space-y-1.5 font-mono">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className={cn("flex items-center gap-1.5 text-slate-400", item.colorClass)}>
                {item.indicatorClass && (
                  <span className={cn("h-2 w-2 rounded-full inline-block", item.indicatorClass)} />
                )}
                {item.label}:
              </span>
              <span className="text-slate-200 font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      )}
      {footer && (
        <div className="pt-2 mt-2 border-t border-slate-800/80 font-mono">
          {footer}
        </div>
      )}
    </div>
  )
}

