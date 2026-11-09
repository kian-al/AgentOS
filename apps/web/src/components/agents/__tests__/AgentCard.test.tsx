import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { AgentCard } from "../AgentCard"
import { AgentConfig } from "@/lib/api"

const mockAgent: AgentConfig = {
  name: "agentOS-architect",
  description: "Plans sprints and architecture before writing code.",
  tools: ["Read", "Glob", "LS"],
  file_path: ".claude/agents/agentOS-architect.md",
  updated_at: "2026-11-04T22:45:00Z",
}

describe("AgentCard Component", () => {
  it("renders agent name, description, and file path", () => {
    render(<AgentCard agent={mockAgent} />)

    expect(screen.getByText("agentOS-architect")).toBeInTheDocument()
    expect(
      screen.getByText("Plans sprints and architecture before writing code.")
    ).toBeInTheDocument()
    expect(screen.getByText(".claude/agents/agentOS-architect.md")).toBeInTheDocument()
  })

  it("renders accessible role and aria-label", () => {
    render(<AgentCard agent={mockAgent} />)

    const card = screen.getByRole("article")
    expect(card).toBeInTheDocument()
    expect(card).toHaveAttribute("aria-label", "Agent: agentOS-architect")
  })

  it("renders each tool badge with static token classes", () => {
    render(<AgentCard agent={mockAgent} />)

    const readBadge = screen.getByText("Read")
    const globBadge = screen.getByText("Glob")
    const lsBadge = screen.getByText("LS")

    expect(readBadge).toBeInTheDocument()
    expect(globBadge).toBeInTheDocument()
    expect(lsBadge).toBeInTheDocument()

    expect(readBadge).toHaveClass("bg-chart-tool/15")
    expect(readBadge).toHaveClass("text-chart-tool")
  })

  it("handles agents with zero tools gracefully", () => {
    const noToolAgent: AgentConfig = {
      ...mockAgent,
      name: "agent-notools",
      tools: [],
    }
    render(<AgentCard agent={noToolAgent} />)

    expect(screen.getByText("None configured")).toBeInTheDocument()
  })

  it("triggers onClick when clicked, activated with Enter, or Space", async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<AgentCard agent={mockAgent} onClick={handleClick} />)

    const card = screen.getByRole("article")
    await user.click(card)
    expect(handleClick).toHaveBeenCalledTimes(1)

    card.focus()
    await user.keyboard("{Enter}")
    expect(handleClick).toHaveBeenCalledTimes(2)

    await user.keyboard(" ")
    expect(handleClick).toHaveBeenCalledTimes(3)
  })
})

