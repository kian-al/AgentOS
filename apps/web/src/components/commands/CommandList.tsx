"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { useCommands } from "@/hooks/useCommands"
import { CommandConfig } from "@/lib/api"
import { CommandDetailSheet } from "@/components/commands/CommandDetailSheet"
import { Skeleton } from "@/components/shared/Skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"
import { DataTooltip } from "@/components/shared/DataTooltip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Terminal, RefreshCw, AlertCircle, ChevronRight, Play } from "lucide-react"
import { staggerContainer, slideUp } from "@/lib/animations"
import { useReducedMotion } from "@/hooks/useReducedMotion"

export interface CommandListProps {
  overrideData?: CommandConfig[]
  overrideLoading?: boolean
  overrideError?: Error | null
  onCommandClick?: (command: CommandConfig) => void
}

function CommandListContent({
  overrideData,
  overrideLoading,
  overrideError,
  onCommandClick,
}: CommandListProps) {
  const { commands: hookCommands, loading: hookLoading, error: hookError, refetch } = useCommands()
  const prefersReduced = useReducedMotion()

  const commands = overrideData ?? hookCommands
  const loading = overrideLoading ?? hookLoading
  const error = overrideError ?? hookError

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedCommand, setSelectedCommand] = useState<CommandConfig | null>(null)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch(true)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCommandSelect = (cmd: CommandConfig) => {
    setSelectedCommand(cmd)
    if (onCommandClick) {
      onCommandClick(cmd)
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-800/40 text-blue-400">
            <Terminal className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Command Center
              </h1>
              <Badge
                variant="outline"
                className="font-mono text-xs border-slate-700 bg-slate-900/80 text-slate-300"
              >
                {loading ? "..." : `${commands.length} available`}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Claude Code slash commands discovered from{" "}
              <code className="text-slate-300 font-mono text-xs">.claude/commands/*.md</code>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <DataTooltip content="All slash commands run locally on your system using Claude Code CLI.">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>local-only execution</span>
            </div>
          </DataTooltip>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            aria-label="Refresh command library"
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
            <h4 className="text-sm font-semibold">Failed to load slash commands</h4>
            <p className="text-xs text-red-400/80 mt-0.5">{error.message}</p>
          </div>
        </div>
      ) : loading ? (
        <div
          aria-label="Loading slash commands"
          className="space-y-3"
        >
          <Skeleton variant="row" count={4} />
        </div>
      ) : commands.length === 0 ? (
        <EmptyState
          title="No Commands Configured"
          description="No slash command markdown files found in .claude/commands/*.md. Add command definition files to automate development workflows."
          sprint="Sprint 4"
          icon={<Terminal className="h-6 w-6" />}
        />
      ) : (
        <motion.div
          variants={prefersReduced ? undefined : staggerContainer}
          initial={prefersReduced ? undefined : "hidden"}
          animate={prefersReduced ? undefined : "visible"}
          className="space-y-2.5"
        >
          {commands.map((cmd) => (
            <motion.div
              key={cmd.name}
              variants={prefersReduced ? undefined : slideUp}
            >
              <div
                role="button"
                tabIndex={0}
                aria-label={`Open command /${cmd.name}`}
                onClick={() => handleCommandSelect(cmd)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleCommandSelect(cmd)
                  }
                }}
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 hover:border-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 select-none"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-blue-950/80 text-blue-400 border border-blue-800/50 group-hover:border-blue-500/50 transition-colors shrink-0">
                    /{cmd.name}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-white tracking-tight truncate group-hover:text-blue-300 transition-colors">
                      {cmd.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {cmd.description || "No description provided."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <Play className="h-3 w-3 text-slate-400" aria-hidden="true" />
                    <span>Slash Command</span>
                  </span>
                  <ChevronRight
                    className="h-4 w-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Command Detail Sheet */}
      <CommandDetailSheet
        command={selectedCommand}
        open={Boolean(selectedCommand)}
        onClose={() => setSelectedCommand(null)}
      />
    </div>
  )
}

export function CommandList(props: CommandListProps) {
  return (
    <ErrorBoundary name="CommandList">
      <CommandListContent {...props} />
    </ErrorBoundary>
  )
}

