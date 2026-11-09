import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { ModelBreakdown } from "../ModelBreakdown"
import * as breakdownHook from "@/hooks/useBreakdown"
import { useBreakdownHighlightStore } from "@/store/breakdownHighlightStore"

vi.mock("recharts", async () => {
  const original = await vi.importActual<typeof import("recharts")>("recharts")
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 400, height: 200 }}>{children}</div>
    ),
  }
})

vi.mock("@/hooks/useBreakdown")

describe("ModelBreakdown", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useBreakdownHighlightStore.getState().clearHighlight()
  })

  it("renders loading indicator while data is in-flight", () => {
    vi.mocked(breakdownHook.useBreakdown).mockReturnValue({
      data: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
    })

    render(<ModelBreakdown />)
    expect(screen.getByLabelText("Loading model breakdown")).toBeInTheDocument()
  })

  it("renders empty state when no telemetry exists", () => {
    vi.mocked(breakdownHook.useBreakdown).mockReturnValue({
      data: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<ModelBreakdown />)
    expect(screen.getByText("No model telemetry recorded")).toBeInTheDocument()
  })

  it("renders model rows and accessible table alternative", () => {
    const mockData = [
      { key: "claude-3-5-sonnet", tokens: 250000, cost_usd: 1.25, events: 12, pct: 75.0 },
      { key: "claude-haiku-3", tokens: 100000, cost_usd: 0.42, events: 8, pct: 25.0 },
    ]

    vi.mocked(breakdownHook.useBreakdown).mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<ModelBreakdown />)

    // Visual cards and labels
    expect(screen.getByText("By Model")).toBeInTheDocument()
    expect(screen.getAllByText("claude-3-5-sonnet").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("claude-haiku-3").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("75%").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("25%").length).toBeGreaterThanOrEqual(1)

    // Accessible data table (WCAG 1.1.1)
    const caption = screen.getByText("Token and cost breakdown by model")
    expect(caption).toBeInTheDocument()
    const table = caption.closest("table")
    expect(table).toHaveClass("sr-only")
  })

  it("updates shared highlight store on row hover/focus", async () => {
    const user = userEvent.setup()
    const mockData = [
      { key: "claude-3-5-sonnet", tokens: 250000, cost_usd: 1.25, events: 12, pct: 100.0 },
    ]

    vi.mocked(breakdownHook.useBreakdown).mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<ModelBreakdown />)

    const rowButton = screen.getByRole("button", { name: /claude-3-5-sonnet/i })
    expect(useBreakdownHighlightStore.getState().highlightedKey).toBeNull()

    await user.hover(rowButton)
    expect(useBreakdownHighlightStore.getState().highlightedKey).toBe("claude-3-5-sonnet")

    await user.unhover(rowButton)
    expect(useBreakdownHighlightStore.getState().highlightedKey).toBeNull()
  })
})

