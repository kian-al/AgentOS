import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { TokenHeatmap } from "../TokenHeatmap"
import * as heatmapHook from "@/hooks/useHeatmap"
import { HeatmapDay } from "@/lib/api"

vi.mock("@/hooks/useHeatmap")

function getPastDateISO(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

describe("TokenHeatmap Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders correct number of day cells for 90d range (90 cells)", () => {
    const mockData: HeatmapDay[] = [
      { day: getPastDateISO(0), tokens: 5000 },
      { day: getPastDateISO(1), tokens: 12000 },
    ]

    vi.mocked(heatmapHook.useHeatmap).mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      range: "90d",
      setRange: vi.fn(),
      refetch: vi.fn(),
    })

    render(<TokenHeatmap initialRange="90d" />)

    const grid = screen.getByRole("grid", { name: /token usage heatmap/i })
    expect(grid).toBeInTheDocument()

    const cells = screen.getAllByRole("gridcell")
    expect(cells).toHaveLength(90)
  })

  it("ensures each cell has a valid and descriptive aria-label", () => {
    const mockData: HeatmapDay[] = [
      { day: getPastDateISO(0), tokens: 12400 },
    ]

    vi.mocked(heatmapHook.useHeatmap).mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      range: "90d",
      setRange: vi.fn(),
      refetch: vi.fn(),
    })

    render(<TokenHeatmap initialRange="90d" />)

    const cells = screen.getAllByRole("gridcell")
    cells.forEach((cell) => {
      const label = cell.getAttribute("aria-label")
      expect(label).toBeTruthy()
      expect(label).toMatch(/^\d{4}-\d{2}-\d{2}: [0-9,]+ tokens$/)
    })
  })

  it("applies correct static Tailwind intensity classes across all percentile buckets", () => {
    // 4 non-zero values to form clear quartiles: 1000, 2000, 3000, 4000
    // nonZero: [1000, 2000, 3000, 4000]
    // p25 = 2000, p50 = 3000, p75 = 4000
    const d0 = getPastDateISO(0) // 0 tokens -> bg-slate-800
    const d1 = getPastDateISO(1) // 1000 (< p25) -> bg-chart-input/30
    const d2 = getPastDateISO(2) // 2500 (< p50) -> bg-chart-input/55
    const d3 = getPastDateISO(3) // 3500 (< p75) -> bg-chart-input/80
    const d4 = getPastDateISO(4) // 5000 (>= p75) -> bg-chart-input

    const mockData: HeatmapDay[] = [
      { day: d1, tokens: 1000 },
      { day: d2, tokens: 2500 },
      { day: d3, tokens: 3500 },
      { day: d4, tokens: 5000 },
    ]

    vi.mocked(heatmapHook.useHeatmap).mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      range: "90d",
      setRange: vi.fn(),
      refetch: vi.fn(),
    })

    render(<TokenHeatmap initialRange="90d" />)

    const cell0 = screen.getByLabelText(new RegExp(`^${d0}: 0 tokens`))
    expect(cell0).toHaveClass("bg-slate-800")

    const cell1 = screen.getByLabelText(new RegExp(`^${d1}: 1,000 tokens`))
    expect(cell1).toHaveClass("bg-chart-input/30")

    const cell2 = screen.getByLabelText(new RegExp(`^${d2}: 2,500 tokens`))
    expect(cell2).toHaveClass("bg-chart-input/55")

    const cell3 = screen.getByLabelText(new RegExp(`^${d3}: 3,500 tokens`))
    expect(cell3).toHaveClass("bg-chart-input/80")

    const cell4 = screen.getByLabelText(new RegExp(`^${d4}: 5,000 tokens`))
    expect(cell4).toHaveClass("bg-chart-input")
  })

  it("renders empty state when data is empty array []", () => {
    vi.mocked(heatmapHook.useHeatmap).mockReturnValue({
      data: [],
      loading: false,
      error: null,
      range: "90d",
      setRange: vi.fn(),
      refetch: vi.fn(),
    })

    render(<TokenHeatmap initialRange="90d" />)

    expect(screen.getByText("No token telemetry recorded")).toBeInTheDocument()
    expect(screen.queryByRole("grid")).not.toBeInTheDocument()
  })

  it("updates hover state when user hovers a day cell", async () => {
    const user = userEvent.setup()
    const d0 = getPastDateISO(0)
    const mockData: HeatmapDay[] = [{ day: d0, tokens: 42000 }]

    vi.mocked(heatmapHook.useHeatmap).mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      range: "90d",
      setRange: vi.fn(),
      refetch: vi.fn(),
    })

    render(<TokenHeatmap initialRange="90d" />)

    const cell = screen.getByLabelText(new RegExp(`^${d0}: 42,000 tokens`))
    await user.hover(cell)

    expect(screen.getAllByText(/42\.0K tokens/i).length).toBeGreaterThanOrEqual(1)
  })
})

