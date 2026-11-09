"use client"

import React from "react"
import { motion } from "framer-motion"
import { Coins, DollarSign, Activity, Bot } from "lucide-react"
import { useMetricsSummary } from "@/hooks/useMetricsSummary"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { formatTokens, formatUsd, formatDelta } from "@/lib/format"
import { staggerContainer, staggerItem } from "@/lib/animations"
import { useReducedMotion } from "@/hooks/useReducedMotion"

export function KpiGrid() {
  const { data, loading, error } = useMetricsSummary()
  const prefersReduced = useReducedMotion()

  if (error && !data) {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-4 text-sm text-red-300">
        <p className="font-medium">Failed to load real-time metrics.</p>
        <p className="text-xs text-red-400/80 mt-1">{error.message}</p>
      </div>
    )
  }

  const tokensDelta = formatDelta(data?.tokens_delta_pct)
  const costDelta = formatDelta(data?.cost_delta_pct)

  return (
    <section aria-label="Key Performance Indicators" className="w-full">
      <motion.div
        variants={prefersReduced ? undefined : staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* 1. Tokens Today */}
        <motion.div variants={prefersReduced ? undefined : staggerItem}>
          <KpiCard
            title="🪙 Tokens Today"
            value={formatTokens(data?.tokens_today ?? 0)}
            icon={<Coins className="h-4 w-4 text-amber-400" aria-hidden="true" />}
            delta={tokensDelta}
            deltaLabel="vs yesterday"
            sparklineData={[120, 142, 155, 168, 184]}
            sparklineColor="input"
            loading={loading}
          />
        </motion.div>

        {/* 2. Cost Today */}
        <motion.div variants={prefersReduced ? undefined : staggerItem}>
          <KpiCard
            title="💵 Cost Today"
            value={formatUsd(data?.cost_today_usd ?? 0)}
            icon={<DollarSign className="h-4 w-4 text-emerald-400" aria-hidden="true" />}
            delta={costDelta}
            deltaLabel="vs yesterday"
            sparklineData={[6.5, 8.2, 9.4, 11.2, 12.4]}
            sparklineColor="cost"
            loading={loading}
          />
        </motion.div>

        {/* 3. Sessions Active */}
        <motion.div variants={prefersReduced ? undefined : staggerItem}>
          <KpiCard
            title="🔄 Sessions Active"
            value={data?.active_sessions ?? 0}
            icon={<Activity className="h-4 w-4 text-blue-400" aria-hidden="true" />}
            isLive={true}
            deltaLabel="last 15m"
            sparklineData={[1, 2, 2, 3, 2]}
            sparklineColor="session"
            loading={loading}
          />
        </motion.div>

        {/* 4. Agents Seen */}
        <motion.div variants={prefersReduced ? undefined : staggerItem}>
          <KpiCard
            title="🤖 Agents Seen"
            value={data?.agents_seen ?? 0}
            icon={<Bot className="h-4 w-4 text-purple-400" aria-hidden="true" />}
            deltaLabel="today"
            sparklineData={[2, 3, 4, 4, 5]}
            sparklineColor="agent"
            loading={loading}
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
