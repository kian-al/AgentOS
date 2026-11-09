"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useBeaconSocket } from "@/hooks/useBeaconSocket"
import { KpiGrid } from "@/components/dashboard/KpiGrid"
import { TokenTimelineChart } from "@/components/dashboard/TokenTimelineChart"
import { ModelBreakdown } from "@/components/dashboard/ModelBreakdown"
import { AgentBreakdown } from "@/components/dashboard/AgentBreakdown"
import { EventFeed } from "@/components/dashboard/EventFeed"
import { Radio, Sparkles } from "lucide-react"

export default function DashboardPage() {
  const { isConnected } = useBeaconSocket()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <section
        aria-label="AgentOS Status Banner"
        className="rounded-xl border border-blue-900/40 bg-gradient-to-r from-blue-950/60 via-slate-900/80 to-slate-950 p-5 sm:p-6 shadow-lg backdrop-blur"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl" role="img" aria-label="Brain emoji">
                🧠
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                AgentOS is Live
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              The Operating System for AI Agents — Local-first telemetry ingestion,
              session graph observability, and real-time event analytics.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant={isConnected ? "success" : "secondary"}
              className="px-3 py-1 text-xs font-mono transition-colors"
            >
              <Radio
                className={`h-3.5 w-3.5 mr-1.5 ${
                  isConnected
                    ? "motion-safe:animate-pulse motion-reduce:animate-none text-emerald-400"
                    : "text-slate-400"
                }`}
                aria-hidden="true"
              />
              WebSocket: {isConnected ? "Connected" : "Reconnecting..."}
              <span className="sr-only">
                {isConnected ? "WebSocket stream is active" : "WebSocket is disconnected"}
              </span>
            </Badge>
          </div>
        </div>
      </section>

      {/* KPI Summary Cards */}
      <KpiGrid />

      {/* Token Usage Timeline Chart */}
      <TokenTimelineChart />

      {/* Breakdown Panels (By Model & By Agent) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModelBreakdown />
        <AgentBreakdown />
      </div>

      {/* Real-time Stream & Last Event */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Feed Container */}
        <div className="lg:col-span-2">
          <EventFeed />
        </div>

        {/* Platform Pillars Card */}
        <Card className="border-slate-800 bg-slate-900/60 shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-800/70">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" aria-hidden="true" />
              Platform Pillars
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              AgentOS Core Architecture
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs flex-1">
            <div className="p-3 rounded-lg border border-slate-800/90 bg-slate-950/40 hover:border-slate-700/80 transition-colors">
              <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                <span>👁️</span> OBSERVE
              </div>
              <div className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                Real-time token counting, cost tracking & Claude Code session monitoring via Beacon.
              </div>
            </div>
            <div className="p-3 rounded-lg border border-slate-800/90 bg-slate-950/40 hover:border-slate-700/80 transition-colors">
              <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                <span>🎛️</span> CONTROL
              </div>
              <div className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                Agent prompt configuration, slash command registry, and lifecycle hook orchestration.
              </div>
            </div>
            <div className="p-3 rounded-lg border border-slate-800/90 bg-slate-950/40 hover:border-slate-700/80 transition-colors">
              <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                <span>📊</span> UNDERSTAND
              </div>
              <div className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                Model ROI comparison, latency analytics, and quality scoring benchmarks.
              </div>
            </div>
            <div className="p-3 rounded-lg border border-slate-800/90 bg-slate-950/40 hover:border-slate-700/80 transition-colors">
              <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                <span>🧠</span> EVOLVE
              </div>
              <div className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                Self-healing configurations, automated skill discovery, and behavioral pattern learning.
              </div>
            </div>
            <div className="p-3 rounded-lg border border-slate-800/90 bg-slate-950/40 hover:border-slate-700/80 transition-colors">
              <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                <span>🤝</span> COLLABORATE
              </div>
              <div className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                Multi-agent teamwork protocols, skill marketplace, and shared agent templates.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
