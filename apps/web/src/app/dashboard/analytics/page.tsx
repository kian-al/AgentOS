import React from "react"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"
import { CostProjectionWidget } from "@/components/analytics/CostProjectionWidget"
import { TokenHeatmap } from "@/components/analytics/TokenHeatmap"
import { ModelComparisonTable } from "@/components/analytics/ModelComparisonTable"
import { SessionList } from "@/components/analytics/SessionList"
import { BarChart3 } from "lucide-react"

export const metadata = {
  title: "Token Analytics | AgentOS",
  description: "Deep dive into token consumption patterns, historical heatmaps, and efficiency metrics.",
}

export default function DashboardAnalyticsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Token Analytics
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical token density, model comparison tables, expenditure projections, and session drilldown
            </p>
          </div>
        </div>
      </div>

      {/* Story 2.3 — Cost Projection Widget */}
      <ErrorBoundary name="CostProjectionWidget">
        <CostProjectionWidget />
      </ErrorBoundary>

      {/* Story 2.1 — Token Heatmap Calendar */}
      <ErrorBoundary name="TokenHeatmap">
        <TokenHeatmap />
      </ErrorBoundary>

      {/* Story 2.2 — Model Comparison Table */}
      <ErrorBoundary name="ModelComparisonTable">
        <ModelComparisonTable />
      </ErrorBoundary>

      {/* Story 2.4 — Session Token Drilldown */}
      <ErrorBoundary name="SessionList">
        <SessionList />
      </ErrorBoundary>
    </div>
  )
}
