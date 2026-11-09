"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { useAgents } from "@/hooks/useAgents"
import { AgentConfig } from "@/lib/api"
import { AgentCard } from "@/components/agents/AgentCard"
import { AgentDetailSheet } from "@/components/agents/AgentDetailSheet"
import { Skeleton } from "@/components/shared/Skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bot, RefreshCw, AlertCircle } from "lucide-react"
import { staggerContainer, staggerItem } from "@/lib/animations"
import { useReducedMotion } from "@/hooks/useReducedMotion"

interface AgentGridProps {
  overrideData?: AgentConfig[]
  overrideLoading?: boolean
  overrideError?: Error | null
  onAgentClick?: (agent: AgentConfig) => void
}

function AgentGridContent({
  overrideData,
  overrideLoading,
  overrideError,
  onAgentClick,
}: AgentGridProps) {
  const { agents: hookAgents, loading: hookLoading, error: hookError, refetch } = useAgents()
  const prefersReduced = useReducedMotion()

  const agents = overrideData ?? hookAgents
  const loading = overrideLoading ?? hookLoading
  const error = overrideError ?? hookError

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedAgentName, setSelectedAgentName] = useState<string | null>(null)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch(true)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleAgentSelect = (agent: AgentConfig) => {
    setSelectedAgentName(agent.name)
    if (onAgentClick) {
      onAgentClick(agent)
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Page / Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-chart-agent/10 border border-chart-agent/20 text-chart-agent">
            <Bot className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Agent Manager
              </h1>
              <Badge
                variant="outline"
                className="font-mono text-xs border-slate-700 bg-slate-900/80 text-slate-300"
              >
                {loading ? "..." : `${agents.length} configured`}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Claude Code autonomous agents discovered from{" "}
              <code className="text-slate-300 font-mono text-xs">.claude/agents/*.md</code>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            aria-label="Refresh agent configs"
            className="h-8 px-3 text-xs border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? "animate-spin text-blue-400" : "text-slate-400"}`}
              aria-hidden="true"
            />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {error ? (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-6 flex items-center gap-3 text-red-300">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" aria-hidden="true" />
          <div>
            <h4 className="text-sm font-semibold">Failed to load agent configurations</h4>
            <p className="text-xs text-red-400/80 mt-0.5">{error.message}</p>
          </div>
        </div>
      ) : loading ? (
        <div
          aria-label="Loading agent configurations"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <Skeleton variant="card" count={6} />
        </div>
      ) : agents.length === 0 ? (
        <EmptyState
          title="No Agents Configured"
          description="No markdown agent configuration files found in .claude/agents/*.md. Add an agent definition file with YAML frontmatter to get started."
          sprint="Sprint 3"
          icon={<Bot className="h-6 w-6" />}
        />
      ) : (
        <motion.div
          variants={prefersReduced ? undefined : staggerContainer}
          initial={prefersReduced ? undefined : "hidden"}
          animate={prefersReduced ? undefined : "visible"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {agents.map((agent) => (
            <motion.div
              key={agent.name}
              variants={prefersReduced ? undefined : staggerItem}
            >
              <AgentCard
                agent={agent}
                onClick={() => handleAgentSelect(agent)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Story 3.2 & 3.3: Agent Detail Sheet with Edit Form */}
      <AgentDetailSheet
        agentName={selectedAgentName}
        open={Boolean(selectedAgentName)}
        onClose={() => setSelectedAgentName(null)}
        onAgentUpdated={() => refetch(true)}
      />
    </div>
  )
}

export function AgentGrid(props: AgentGridProps) {
  return (
    <ErrorBoundary name="AgentGrid">
      <AgentGridContent {...props} />
    </ErrorBoundary>
  )
}
