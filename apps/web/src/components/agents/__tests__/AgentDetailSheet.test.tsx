import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { AgentDetailSheet } from "../AgentDetailSheet"
import { AgentDetail } from "@/lib/api"
import * as agentDetailHook from "@/hooks/useAgentDetail"

vi.mock("@/hooks/useAgentDetail")

const mockDetail: AgentDetail = {
  config: {
    name: "agentOS-architect",
    description: "Reads sprint stories and outputs structured plans.",
    tools: ["Read", "Glob", "LS"],
    file_path: ".claude/agents/agentOS-architect.md",
    updated_at: "2026-11-04T22:45:00Z",
  },
  stats: {
    total_tokens: 141635,
    total_cost_usd: 1.6605,
    total_events: 44,
    last_seen: "2026-11-07T12:04:00Z",
  },
}

describe("AgentDetailSheet Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders stats (tokens, cost, events, last seen)", () => {
    vi.mocked(agentDetailHook.useAgentDetail).mockReturnValue({
      data: mockDetail,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <AgentDetailSheet
        agentName="agentOS-architect"
        open={true}
        onClose={vi.fn()}
      />
    )

    // Token count formatted: 141.6K
    expect(screen.getByText("141.6K")).toBeInTheDocument()
    // Cost formatted: $1.66
    expect(screen.getByText("$1.66")).toBeInTheDocument()
    // Total events: 44
    expect(screen.getByText("44")).toBeInTheDocument()
    // Description
    expect(
      screen.getByText("Reads sprint stories and outputs structured plans.")
    ).toBeInTheDocument()
  })

  it("renders tools list with configured badges", () => {
    vi.mocked(agentDetailHook.useAgentDetail).mockReturnValue({
      data: mockDetail,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <AgentDetailSheet
        agentName="agentOS-architect"
        open={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText("Configured Tools (3)")).toBeInTheDocument()
    expect(screen.getByText("Read")).toBeInTheDocument()
    expect(screen.getByText("Glob")).toBeInTheDocument()
    expect(screen.getByText("LS")).toBeInTheDocument()
  })

  it("close button has accessible aria-label and triggers onClose", async () => {
    const handleClose = vi.fn()
    const user = userEvent.setup()

    vi.mocked(agentDetailHook.useAgentDetail).mockReturnValue({
      data: mockDetail,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <AgentDetailSheet
        agentName="agentOS-architect"
        open={true}
        onClose={handleClose}
      />
    )

    const closeBtn = screen.getByLabelText("Close agent detail")
    expect(closeBtn).toBeInTheDocument()
    expect(closeBtn).toHaveAttribute("aria-label", "Close agent detail")

    await user.click(closeBtn)
    expect(handleClose).toHaveBeenCalled()
  })

  it("renders sr-only summary of agent stats for screen readers", () => {
    vi.mocked(agentDetailHook.useAgentDetail).mockReturnValue({
      data: mockDetail,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <AgentDetailSheet
        agentName="agentOS-architect"
        open={true}
        onClose={vi.fn()}
      />
    )

    const srSummary = screen.getByText(
      /Agent agentOS-architect summary: 141\.6K total tokens, \$1\.66 total cost, across 44 events\./i
    )
    expect(srSummary).toBeInTheDocument()
    expect(srSummary).toHaveClass("sr-only")
  })

  it("renders loading skeleton placeholder while fetching", () => {
    vi.mocked(agentDetailHook.useAgentDetail).mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <AgentDetailSheet
        agentName="agentOS-architect"
        open={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByTestId("agent-detail-skeleton")).toBeInTheDocument()
  })

  it("toggles between view mode and edit mode using header button", async () => {
    const user = userEvent.setup()
    vi.mocked(agentDetailHook.useAgentDetail).mockReturnValue({
      data: mockDetail,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <AgentDetailSheet
        agentName="agentOS-architect"
        open={true}
        onClose={vi.fn()}
      />
    )

    // Initially in view mode with "Edit" button
    const editBtn = screen.getByLabelText("Edit agent config")
    expect(editBtn).toBeInTheDocument()
    expect(screen.getByText("Telemetry Aggregate Stats")).toBeInTheDocument()

    // Click Edit -> switches to Edit mode
    await user.click(editBtn)

    expect(screen.getByLabelText("View agent details")).toBeInTheDocument()
    expect(screen.getByLabelText("Save agent config")).toBeInTheDocument()
    expect(screen.getByLabelText("Cancel editing agent config")).toBeInTheDocument()

    // Click Cancel -> returns to View mode
    const cancelBtn = screen.getByLabelText("Cancel editing agent config")
    await user.click(cancelBtn)

    expect(screen.getByLabelText("Edit agent config")).toBeInTheDocument()
    expect(screen.getByText("Telemetry Aggregate Stats")).toBeInTheDocument()
  })
})


