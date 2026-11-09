"use client"

import React from "react"
import { motion } from "framer-motion"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"
import { AgentConfig } from "@/lib/api"
import { Bot, Wrench, Clock, FileCode } from "lucide-react"
import { scaleIn } from "@/lib/animations"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { cn } from "@/lib/utils"

interface AgentCardProps {
  agent: AgentConfig
  className?: string
  onClick?: () => void
}

function formatRelativeUpdate(iso: string): string {
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ""
    const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000))
    if (diffSec < 60) return "just now"
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
    return `${Math.floor(diffSec / 86400)}d ago`
  } catch {
    return ""
  }
}

export function AgentCard({ agent, className, onClick }: AgentCardProps) {
  const prefersReduced = useReducedMotion()
  const relativeTime = formatRelativeUpdate(agent.updated_at)

  return (
    <motion.div
      variants={prefersReduced ? undefined : scaleIn}
      initial={prefersReduced ? undefined : "hidden"}
      animate={prefersReduced ? undefined : "visible"}
      className="h-full"
    >
      <Card
        role="article"
        aria-label={`Agent: ${agent.name}`}
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && onClick) {
            e.preventDefault()
            onClick()
          }
        }}
        className={cn(
          "group relative flex flex-col justify-between h-full border border-slate-800 bg-slate-900/60 backdrop-blur rounded-xl p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-700",
          onClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          className
        )}
      >
        <div>
          {/* Header: Bot Icon + Agent Name + Update Timestamp */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-chart-agent/10 border border-chart-agent/20 text-chart-agent shrink-0">
                <Bot className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                  {agent.name}
                </CardTitle>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 mt-0.5">
                  <FileCode className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="truncate max-w-[180px]" title={agent.file_path}>
                    {agent.file_path}
                  </span>
                </div>
              </div>
            </div>

            {relativeTime && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 shrink-0"
                title={`Last modified: ${agent.updated_at}`}
              >
                <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                <span>{relativeTime}</span>
              </span>
            )}
          </div>

          {/* Description */}
          <CardDescription className="text-xs text-slate-300 leading-relaxed line-clamp-3 mb-4">
            {agent.description || "No description provided in frontmatter."}
          </CardDescription>
        </div>

        {/* Footer: Tools List */}
        <div className="pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mb-2">
            <Wrench className="h-3 w-3" aria-hidden="true" />
            <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
              Tools ({agent.tools.length}):
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {agent.tools.length === 0 ? (
              <span className="text-[11px] font-mono text-slate-500 italic">
                None configured
              </span>
            ) : (
              agent.tools.map((tool) => (
                <span
                  key={tool}
                  className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-chart-tool/30 bg-chart-tool/15 text-chart-tool"
                >
                  {tool}
                </span>
              ))
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

