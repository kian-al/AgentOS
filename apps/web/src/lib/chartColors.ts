"use client"

import { useState, useEffect } from "react"

export const CHART_TOKENS = [
  "input",
  "output",
  "cache",
  "cost",
  "error",
  "agent",
  "tool",
  "session",
] as const
export type ChartToken = (typeof CHART_TOKENS)[number]

export const FALLBACK_CHART_COLORS: Record<ChartToken, string> = {
  input: "hsl(var(--chart-input))",
  output: "hsl(var(--chart-output))",
  cache: "hsl(var(--chart-cache))",
  cost: "hsl(var(--chart-cost))",
  error: "hsl(var(--chart-error))",
  agent: "hsl(var(--chart-agent))",
  tool: "hsl(var(--chart-tool))",
  session: "hsl(var(--chart-session))",
}

function parseHsl(raw: string, fallback: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return fallback
  if (trimmed.startsWith("hsl")) return trimmed
  return `hsl(${trimmed})`
}

export function getChartColors(): Record<ChartToken, string> {
  if (typeof window === "undefined") {
    return FALLBACK_CHART_COLORS
  }

  const style = getComputedStyle(document.documentElement)
  const result: Record<ChartToken, string> = { ...FALLBACK_CHART_COLORS }

  for (const token of CHART_TOKENS) {
    const val = style.getPropertyValue(`--chart-${token}`)
    if (val) {
      result[token] = parseHsl(val, FALLBACK_CHART_COLORS[token])
    }
  }

  return result
}

/**
 * Hook to retrieve dynamic HSL chart color values for SVG/Canvas (e.g. Recharts).
 * SSR-safe and reacts dynamically to theme class/style changes on document.documentElement.
 */
export function useChartColors(): Record<ChartToken, string> {
  const [colors, setColors] = useState<Record<ChartToken, string>>(FALLBACK_CHART_COLORS)

  useEffect(() => {
    // Read computed tokens on mount
    setColors(getChartColors())

    // Observe theme class or style toggles on <html>
    const observer = new MutationObserver(() => {
      setColors(getChartColors())
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    })

    return () => observer.disconnect()
  }, [])

  return colors
}

