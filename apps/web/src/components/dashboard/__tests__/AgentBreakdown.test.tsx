import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { AgentBreakdown } from "../AgentBreakdown"
import * as breakdownHook from "@/hooks/useBreakdown"
import { useBreakdownHighlightStore } from "@/store/breakdownHighlightStore"

vi.mock("@/hooks/useBreakdown")

describe("AgentBreakdown", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useBreakdownHighlightStore.getState().clearHighlight()
  })

  it("renders loading indicator when fetching", () => {
    vi.mocked(breakdownHook.useBreakdown).mockReturnValue({
      data: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
    })

    render(<AgentBreakdown />)
    expect(screen.getByLabelText("Loading agent breakdown")).toBeInTheDocument()
  })

  it("renders empty state when no agent telemetry exists", () => {
    vi.mocked(breakdownHook.useBreakdown).mockReturnValue({
      data: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<AgentBreakdown />)
    expect(screen.getByText("No agent telemetry recorded")).toBeInTheDocument()
  })

  it("renders agent items with name, cost, tokens, and percentage", () => {
    const mockData = [
      { key: "agentOS-backend", tokens: 180000, cost_usd: 0.95, events: 15, pct: 60.0 },
      { key: "agentOS-frontend", tokens: 120000, cost_usd: 0.55, events: 10, pct: 40.0 },
    ]

    vi.mocked(breakdownHook.useBreakdown).mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<AgentBreakdown />)

    expect(screen.getByText("By Agent")).toBeInTheDocument()
    expect(screen.getAllByText("agentOS-backend").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("agentOS-frontend").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("60%").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("40%").length).toBeGreaterThanOrEqual(1)

    // Accessible table
    expect(screen.getByText("Resource consumption by agent")).toBeInTheDocument()
  })

  it("synchronizes highlight state with store on hover and keyboard focus", async () => {
    const user = userEvent.setup()
    const mockData = [
      { key: "agentOS-backend", tokens: 180000, cost_usd: 0.95, events: 15, pct: 100.0 },
    ]

    vi.mocked(breakdownHook.useBreakdown).mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<AgentBreakdown />)

    const item = screen.getByRole("listitem")
    expect(useBreakdownHighlightStore.getState().highlightedKey).toBeNull()

    await user.hover(item)
    expect(useBreakdownHighlightStore.getState().highlightedKey).toBe("agentOS-backend")

    await user.unhover(item)
    expect(useBreakdownHighlightStore.getState().highlightedKey).toBeNull()

    // Keyboard focus
    item.focus()
    expect(useBreakdownHighlightStore.getState().highlightedKey).toBe("agentOS-backend")

    item.blur()
    expect(useBreakdownHighlightStore.getState().highlightedKey).toBeNull()
  })
})

