import React from "react"
import { Metadata } from "next"
import { AgentGrid } from "@/components/agents/AgentGrid"

export const metadata: Metadata = {
  title: "Agent Manager | AgentOS",
  description: "Claude Code autonomous agents and configuration manager.",
}

export default function AgentsDashboardPage() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <AgentGrid />
    </div>
  )
}
