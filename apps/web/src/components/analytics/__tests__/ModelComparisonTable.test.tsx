import React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { ModelComparisonTable } from "../ModelComparisonTable"
import * as modelStatsHook from "@/hooks/useModelStats"
import { ModelStat } from "@/lib/api"

vi.mock("@/hooks/useModelStats")

const mockModelData: ModelStat[] = [
  {
    model: "claude-haiku-3",
    events: 45,
    tokens: 95000,
    cost_usd: 0.12,
    cost_per_million: 1.2632,
  },
  {
    model: "claude-sonnet-4",
    events: 20,
    tokens: 150000,
    cost_usd: 1.85,
    cost_per_million: 12.3333,
  },
  {
    model: "claude-opus-4",
    events: 10,
    tokens: 80000,
    cost_usd: 4.5,
    cost_per_million: 56.25,
  },
]

describe("ModelComparisonTable Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders all model rows with correct statistics", () => {
    vi.mocked(modelStatsHook.useModelStats).mockReturnValue({
      data: mockModelData,
      loading: false,
      error: null,
      range: "24h",
      setRange: vi.fn(),
      refetch: vi.fn(),
    })

    render(<ModelComparisonTable />)

    expect(screen.getByRole("table", { name: /model comparison table/i })).toBeInTheDocument()
    expect(screen.getByText("3 models tracked")).toBeInTheDocument()

    expect(screen.getByText("claude-haiku-3")).toBeInTheDocument()
    expect(screen.getByText("claude-sonnet-4")).toBeInTheDocument()
    expect(screen.getByText("claude-opus-4")).toBeInTheDocument()

    // Check token formatting
    expect(screen.getByText("95.0K")).toBeInTheDocument()
    expect(screen.getByText("150.0K")).toBeInTheDocument()
    expect(screen.getByText("80.0K")).toBeInTheDocument()

    // Check cost formatting
    expect(screen.getByText("$0.12")).toBeInTheDocument()
    expect(screen.getByText("$1.85")).toBeInTheDocument()
    expect(screen.getByText("$4.50")).toBeInTheDocument()
  })

  it("sorts by Total Cost descending by default, then ascending on header click", async () => {
    const user = userEvent.setup()

    vi.mocked(modelStatsHook.useModelStats).mockReturnValue({
      data: mockModelData,
      loading: false,
      error: null,
      range: "24h",
      setRange: vi.fn(),
      refetch: vi.fn(),
    })

    render(<ModelComparisonTable />)

    const costHeader = screen.getByRole("columnheader", { name: /total cost/i })
    expect(costHeader).toHaveAttribute("aria-sort", "descending")

    // Verify initial row order (descending cost: Opus -> Sonnet -> Haiku)
    let rows = screen.getAllByRole("row").slice(1) // skip header row
    expect(within(rows[0]).getByText("claude-opus-4")).toBeInTheDocument()
    expect(within(rows[1]).getByText("claude-sonnet-4")).toBeInTheDocument()
    expect(within(rows[2]).getByText("claude-haiku-3")).toBeInTheDocument()

    // Click Total Cost header button to toggle to ascending
    const costButton = within(costHeader).getByRole("button")
    await user.click(costButton)

    expect(costHeader).toHaveAttribute("aria-sort", "ascending")

    // Verify reversed order (ascending cost: Haiku -> Sonnet -> Opus)
    rows = screen.getAllByRole("row").slice(1)
    expect(within(rows[0]).getByText("claude-haiku-3")).toBeInTheDocument()
    expect(within(rows[1]).getByText("claude-sonnet-4")).toBeInTheDocument()
    expect(within(rows[2]).getByText("claude-opus-4")).toBeInTheDocument()
  })

  it("properly updates aria-sort when different headers are clicked", async () => {
    const user = userEvent.setup()

    vi.mocked(modelStatsHook.useModelStats).mockReturnValue({
      data: mockModelData,
      loading: false,
      error: null,
      range: "24h",
      setRange: vi.fn(),
      refetch: vi.fn(),
    })

    render(<ModelComparisonTable />)

    const modelHeader = screen.getByRole("columnheader", { name: /^model/i })
    const eventsHeader = screen.getByRole("columnheader", { name: /events/i })
    const costHeader = screen.getByRole("columnheader", { name: /total cost/i })

    expect(costHeader).toHaveAttribute("aria-sort", "descending")
    expect(modelHeader).toHaveAttribute("aria-sort", "none")
    expect(eventsHeader).toHaveAttribute("aria-sort", "none")

    // Click model header -> sorts ascending first
    const modelButton = within(modelHeader).getByRole("button")
    await user.click(modelButton)

    expect(modelHeader).toHaveAttribute("aria-sort", "ascending")
    expect(costHeader).toHaveAttribute("aria-sort", "none")

    // Click events header -> sorts descending first
    const eventsButton = within(eventsHeader).getByRole("button")
    await user.click(eventsButton)

    expect(eventsHeader).toHaveAttribute("aria-sort", "descending")
    expect(modelHeader).toHaveAttribute("aria-sort", "none")
  })

  it("renders empty state when data is empty array []", () => {
    vi.mocked(modelStatsHook.useModelStats).mockReturnValue({
      data: [],
      loading: false,
      error: null,
      range: "24h",
      setRange: vi.fn(),
      refetch: vi.fn(),
    })

    render(<ModelComparisonTable />)

    expect(screen.getByText("No model telemetry recorded")).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })
})

