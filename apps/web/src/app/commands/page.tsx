import React from "react"
import { Metadata } from "next"
import { CommandList } from "@/components/commands/CommandList"

export const metadata: Metadata = {
  title: "Command Center | AgentOS",
  description: "Claude Code slash commands library and execution console.",
}

export default function CommandsPage() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <CommandList />
    </div>
  )
}

