import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { AgentGrid } from "../AgentGrid"
import * as agentsHook from "@/hooks/useAgents"
import { AgentConfig } from "@/lib/api"

vi.mock("@/hooks/useAgents")

const mockAgents: AgentConfig[] = [
  {
    name: "agentOS-architect",
    description: "Architect agent",
    tools: ["Read", "Glob"],
    file_path: ".claude/agents/agentOS-architect.md",
    updated_at: "2026-11-04T22:45:00Z",
  },
  {
    name: "agentOS-backend",
    description: "Backend engineer",
    tools: ["Read", "Write", "Bash"],
    file_path: ".claude/agents/agentOS-backend.md",
    updated_at: "2026-11-04T22:45:00Z",
  },
]

describe("AgentGrid Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders header, count badge, and agent cards", () => {
    vi.mocked(agentsHook.useAgents).mockReturnValue({
      agents: mockAgents,
      data: mockAgents,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<AgentGrid />)

    expect(screen.getByText("Agent Manager")).toBeInTheDocument()
    expect(screen.getByText("2 configured")).toBeInTheDocument()
    expect(screen.getByText("agentOS-architect")).toBeInTheDocument()
    expect(screen.getByText("agentOS-backend")).toBeInTheDocument()
  })

  it("renders loading skeletons when loading is true", () => {
    vi.mocked(agentsHook.useAgents).mockReturnValue({
      agents: [],
      data: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
    })

    render(<AgentGrid />)

    expect(screen.getByLabelText("Loading agent configurations")).toBeInTheDocument()
  })

  it("renders EmptyState when no agents are configured", () => {
    vi.mocked(agentsHook.useAgents).mockReturnValue({
      agents: [],
      data: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<AgentGrid />)

    expect(screen.getByText("No Agents Configured")).toBeInTheDocument()
    expect(
      screen.getByText(/No markdown agent configuration files found/i)
    ).toBeInTheDocument()
  })

  it("triggers refetch when Refresh button is clicked", async () => {
    const mockRefetch = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    vi.mocked(agentsHook.useAgents).mockReturnValue({
      agents: mockAgents,
      data: mockAgents,
      loading: false,
      error: null,
      refetch: mockRefetch,
    })

    render(<AgentGrid />)

    const refreshBtn = screen.getByRole("button", { name: /refresh agent configs/i })
    expect(refreshBtn).toBeInTheDocument()

    await user.click(refreshBtn)
    expect(mockRefetch).toHaveBeenCalledWith(true)
  })

  it("opens detail sheet callback on click, Enter, and Space", async () => {
    const handleAgentClick = vi.fn()
    const user = userEvent.setup()

    vi.mocked(agentsHook.useAgents).mockReturnValue({
      agents: mockAgents,
      data: mockAgents,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<AgentGrid onAgentClick={handleAgentClick} />)

    const cards = screen.getAllByRole("article")
    expect(cards.length).toBe(2)

    // 1. Click opens detail callback
    await user.click(cards[0])
    expect(handleAgentClick).toHaveBeenCalledWith(mockAgents[0])

    // Detail sheet close button should appear
    expect(screen.getByLabelText("Close agent detail")).toBeInTheDocument()

    // Close sheet
    await user.click(screen.getByLabelText("Close agent detail"))

    // 2. Enter key opens detail callback
    cards[1].focus()
    await user.keyboard("{Enter}")
    expect(handleAgentClick).toHaveBeenCalledWith(mockAgents[1])

    // Close sheet
    await user.click(screen.getByLabelText("Close agent detail"))

    // 3. Space key opens detail callback
    cards[0].focus()
    await user.keyboard(" ")
    expect(handleAgentClick).toHaveBeenCalledWith(mockAgents[0])
  })
})

