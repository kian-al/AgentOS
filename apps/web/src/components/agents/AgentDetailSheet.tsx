"use client"

import React, { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/shared/Skeleton"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"
import { DataTooltip } from "@/components/shared/DataTooltip"
import { AgentEditForm } from "@/components/agents/AgentEditForm"
import { useAgentDetail } from "@/hooks/useAgentDetail"
import { AgentDetail, AgentConfig } from "@/lib/api"
import { formatUsd, formatTokens } from "@/lib/format"
import {
  Bot,
  Wrench,
  Clock,
  FileCode,
  Coins,
  DollarSign,
  Activity,
  X,
  Code2,
  AlertCircle,
  Pencil,
  Eye,
} from "lucide-react"

export interface AgentDetailSheetProps {
  agentName: string | null
  open: boolean
  onClose: () => void
  overrideDetail?: AgentDetail
  overrideLoading?: boolean
  onAgentUpdated?: (updated: AgentConfig) => void
}

function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "Never"
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return "Never"
    const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000))
    if (diffSec < 60) return "just now"
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
    return `${Math.floor(diffSec / 86400)}d ago`
  } catch {
    return "Never"
  }
}

function formatFrontmatterPreview(cfg: AgentConfig): string {
  const lines = [
    "---",
    `name: ${cfg.name}`,
    `description: "${cfg.description.replace(/"/g, '\\"')}"`,
    `tools: [${cfg.tools.map((t) => `"${t}"`).join(", ")}]`,
    `file_path: "${cfg.file_path}"`,
    `updated_at: "${cfg.updated_at}"`,
    "---",
  ]
  return lines.join("\n")
}

export function AgentDetailSheetContent({
  agentName,
  open,
  onClose,
  overrideDetail,
  overrideLoading,
  onAgentUpdated,
}: AgentDetailSheetProps) {
  const { data: hookData, loading: hookLoading, error, refetch } = useAgentDetail(open ? agentName : null)

  const loading = overrideLoading ?? hookLoading
  const detail = overrideDetail ?? hookData
  const [isEditing, setIsEditing] = useState(false)

  // Reset edit mode when sheet is closed or agent changes
  useEffect(() => {
    setIsEditing(false)
  }, [agentName, open])

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        className="w-full sm:max-w-xl overflow-y-auto bg-slate-950 border-l border-slate-800 text-slate-200 p-6 space-y-6"
        aria-describedby="agent-detail-desc"
      >
        {/* Accessible close button with required aria-label */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close agent detail"
          className="absolute right-4 top-4 rounded-md p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Close agent detail</span>
        </button>

        <SheetHeader className="pb-4 border-b border-slate-800/80 pr-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-chart-agent/10 border border-chart-agent/20 text-chart-agent shrink-0">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-lg font-bold text-white tracking-tight">
                    {detail?.config?.name || agentName || "Agent Details"}
                  </SheetTitle>
                  {detail?.stats?.last_seen && (
                    <Badge
                      variant="outline"
                      className="border-slate-700 bg-slate-900/80 font-mono text-[10px] text-slate-300"
                    >
                      Active {formatRelativeTime(detail.stats.last_seen)}
                    </Badge>
                  )}
                </div>
                <SheetDescription
                  id="agent-detail-desc"
                  className="text-xs text-slate-400 mt-0.5"
                >
                  Claude Code agent frontmatter configuration and live SQL telemetry
                </SheetDescription>
              </div>
            </div>

            {detail && !loading && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                aria-label={isEditing ? "View agent details" : "Edit agent config"}
                className="h-8 px-3 text-xs border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors shrink-0"
              >
                {isEditing ? (
                  <>
                    <Eye className="h-3.5 w-3.5 mr-1.5 text-slate-400" aria-hidden="true" />
                    <span>View</span>
                  </>
                ) : (
                  <>
                    <Pencil className="h-3.5 w-3.5 mr-1.5 text-blue-400" aria-hidden="true" />
                    <span>Edit</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </SheetHeader>

        {loading ? (
          <div data-testid="agent-detail-skeleton" className="space-y-6 pt-2">
            <div className="space-y-2">
              <Skeleton variant="text" className="h-5 w-3/4 bg-slate-800" />
              <Skeleton variant="text" className="h-4 w-1/2 bg-slate-800" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton variant="card" count={4} />
            </div>
            <div className="space-y-2">
              <Skeleton variant="text" className="h-4 w-1/3 bg-slate-800" />
              <Skeleton variant="row" count={2} />
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-5 flex items-start gap-3 text-red-300">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h4 className="text-sm font-semibold">Failed to load agent details</h4>
              <p className="text-xs text-red-400/80 mt-1">{error.message}</p>
            </div>
          </div>
        ) : detail ? (
          isEditing ? (
            <AgentEditForm
              agent={detail.config}
              onSaveSuccess={async (updated) => {
                setIsEditing(false)
                await refetch()
                onAgentUpdated?.(updated)
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div className="space-y-6">
              {/* Screen-reader accessible summary of agent stats */}
              <div className="sr-only" aria-live="polite">
                Agent {detail.config.name} summary: {formatTokens(detail.stats.total_tokens)} total tokens,{" "}
                {formatUsd(detail.stats.total_cost_usd)} total cost, across {detail.stats.total_events} events.
              </div>

              {/* Description & File metadata */}
              <div className="space-y-3">
                <p className="text-sm text-slate-300 leading-relaxed">
                  {detail.config.description || "No description provided in frontmatter."}
                </p>

                <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-slate-800 bg-slate-900/40 text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <FileCode className="h-3.5 w-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                    <span className="text-slate-500">Path:</span>
                    <span className="text-slate-300 truncate" title={detail.config.file_path}>
                      {detail.config.file_path}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                    <span className="text-slate-500">Updated:</span>
                    <span className="text-slate-300">
                      {detail.config.updated_at ? new Date(detail.config.updated_at).toLocaleString() : "Unknown"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Stats Grid */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                  Telemetry Aggregate Stats
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* Total Tokens */}
                  <DataTooltip
                    label="Input + Output Tokens"
                    subtext="Aggregated across all recorded events in SQLite"
                  >
                    <div className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-xs font-medium">Total Tokens</span>
                        <Coins className="h-4 w-4 text-chart-input" aria-hidden="true" />
                      </div>
                      <div className="text-lg font-bold font-mono text-white">
                        {formatTokens(detail.stats.total_tokens)}
                      </div>
                    </div>
                  </DataTooltip>

                  {/* Total Cost */}
                  <DataTooltip
                    label="Total Model Spend"
                    subtext="Cumulative cost in USD for this agent"
                  >
                    <div className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-xs font-medium">Total Cost</span>
                        <DollarSign className="h-4 w-4 text-chart-cost" aria-hidden="true" />
                      </div>
                      <div className="text-lg font-bold font-mono text-white">
                        {formatUsd(detail.stats.total_cost_usd)}
                      </div>
                    </div>
                  </DataTooltip>

                  {/* Total Events */}
                  <DataTooltip
                    label="Telemetry Events"
                    subtext="Total execution events triggered by this agent"
                  >
                    <div className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-xs font-medium">Events</span>
                        <Activity className="h-4 w-4 text-chart-tool" aria-hidden="true" />
                      </div>
                      <div className="text-lg font-bold font-mono text-white">
                        {detail.stats.total_events.toLocaleString()}
                      </div>
                    </div>
                  </DataTooltip>

                  {/* Last Seen */}
                  <DataTooltip
                    label="Last Telemetry Activity"
                    subtext={detail.stats.last_seen || "No telemetry logged"}
                  >
                    <div className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors">
                      <div className="flex items-center justify-between text-slate-400 mb-1">
                        <span className="text-xs font-medium">Last Seen</span>
                        <Clock className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      </div>
                      <div className="text-sm font-semibold font-mono text-white truncate">
                        {formatRelativeTime(detail.stats.last_seen)}
                      </div>
                    </div>
                  </DataTooltip>
                </div>
              </div>

              {/* Tools List */}
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-chart-tool" aria-hidden="true" />
                  <span>Configured Tools ({detail.config.tools.length})</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {detail.config.tools.length > 0 ? (
                    detail.config.tools.map((tool) => (
                      <span
                        key={tool}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border border-chart-tool/30 bg-chart-tool/10 text-chart-tool"
                      >
                        <Wrench className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span>{tool}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">No tools configured</span>
                  )}
                </div>
              </div>

              {/* Raw Frontmatter Preview */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
                  <span>Raw Frontmatter</span>
                </h3>
                <pre
                  tabIndex={0}
                  aria-label="Raw frontmatter preview"
                  className="p-3.5 rounded-lg border border-slate-800 bg-slate-900/60 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed focus:outline-none focus:ring-1 focus:ring-slate-700 select-all"
                >
                  {formatFrontmatterPreview(detail.config)}
                </pre>
              </div>
            </div>
          )
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

export function AgentDetailSheet(props: AgentDetailSheetProps) {
  return (
    <ErrorBoundary name="AgentDetailSheet">
      <AgentDetailSheetContent {...props} />
    </ErrorBoundary>
  )
}

