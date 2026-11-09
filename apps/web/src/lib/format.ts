/**
 * Value formatters for AgentOS telemetry and KPI metrics.
 */

export interface DeltaInfo {
  text: string
  direction: "up" | "down" | "neutral"
  color: "emerald" | "rose" | "slate"
  toString(): string
}

/**
 * Format token counts with SI suffixes (K, M, B).
 * Examples:
 *   184200  -> "184.2K"
 *   1400000 -> "1.4M"
 *   500     -> "500"
 *   0       -> "0"
 */
export function formatTokens(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "0"
  const abs = Math.abs(n)
  const sign = n < 0 ? "-" : ""

  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1)}M`
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(1)}K`
  }
  return `${sign}${Math.round(abs).toLocaleString()}`
}

/**
 * Format monetary USD values with currency symbol and 2 decimals.
 * Examples:
 *   4.37    -> "$4.37"
 *   1240.00 -> "$1,240.00"
 *   0       -> "$0.00"
 */
export function formatUsd(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "$0.00"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

/**
 * Format delta percentage vs historical baseline.
 * Examples:
 *   12.0  -> { text: "▲ 12%", color: "emerald", direction: "up" }
 *   -3.0  -> { text: "▼ 3%", color: "rose", direction: "down" }
 *   0     -> { text: "—", color: "slate", direction: "neutral" }
 */
export function formatDelta(pct: number | null | undefined): DeltaInfo {
  if (pct === null || pct === undefined || isNaN(pct) || pct === 0) {
    return {
      text: "—",
      direction: "neutral",
      color: "slate",
      toString() {
        return this.text
      },
    }
  }

  const abs = Math.abs(pct)
  const rounded = Math.round(abs * 10) / 10
  const formattedPct = Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1)

  if (pct > 0) {
    return {
      text: `▲ ${formattedPct}%`,
      direction: "up",
      color: "emerald",
      toString() {
        return this.text
      },
    }
  }

  return {
    text: `▼ ${formattedPct}%`,
    direction: "down",
    color: "rose",
    toString() {
      return this.text
    },
  }
}

