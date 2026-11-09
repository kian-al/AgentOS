import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { CostProjectionWidget } from "../CostProjectionWidget"
import * as projectionHook from "@/hooks/useProjection"
import { ProjectionResult } from "@/lib/api"

vi.mock("recharts", async () => {
  const original = await vi.importActual<typeof import("recharts")>("recharts")
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 400, height: 200 }}>{children}</div>
    ),
  }
})

vi.mock("@/hooks/useProjection")

const mockProjectionData: ProjectionResult = {
  daily_avg_usd: 0.87,
  trend_slope: 0.045,
  projected_month_usd: 36.16,
  projected_month_tokens: 1850000,
  confidence: "high",
  data_points: 25,
  history: [
    { date: "2026-10-15", cost_usd: 0.5, tokens: 40000 },
    { date: "2026-10-16", cost_usd: 0.6, tokens: 45000 },
    { date: "2026-10-17", cost_usd: 0.7, tokens: 50000 },
    { date: "2026-10-18", cost_usd: 0.8, tokens: 55000 },
  ],
}

describe("CostProjectionWidget Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders projected cost as formatted USD and daily metrics", () => {
    vi.mocked(projectionHook.useProjection).mockReturnValue({
      data: mockProjectionData,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<CostProjectionWidget />)

    // Projected monthly cost
    expect(screen.getByText("$36.16")).toBeInTheDocument()
    expect(screen.getByText(/projected this month/i)).toBeInTheDocument()

    // Daily average
    expect(screen.getByText("$0.87")).toBeInTheDocument()

    // Trend slope
    expect(screen.getByText("+0.0450")).toBeInTheDocument()

    // Projected tokens
    expect(screen.getByText("1.9M")).toBeInTheDocument()
  })

  it("renders correct confidence badge class for each level (low, medium, high)", () => {
    // 1. High confidence -> text-chart-cache
    vi.mocked(projectionHook.useProjection).mockReturnValue({
      data: { ...mockProjectionData, confidence: "high" },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    const { rerender } = render(<CostProjectionWidget />)
    let badge = screen.getByText("high")
    expect(badge).toHaveClass("text-chart-cache")
    expect(badge).toHaveClass("bg-chart-cache/20")

    // 2. Medium confidence -> text-chart-tool
    vi.mocked(projectionHook.useProjection).mockReturnValue({
      data: { ...mockProjectionData, confidence: "medium" },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    rerender(<CostProjectionWidget />)
    badge = screen.getByText("medium")
    expect(badge).toHaveClass("text-chart-tool")
    expect(badge).toHaveClass("bg-chart-tool/20")

    // 3. Low confidence -> text-chart-error
    vi.mocked(projectionHook.useProjection).mockReturnValue({
      data: { ...mockProjectionData, confidence: "low" },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    rerender(<CostProjectionWidget />)
    badge = screen.getByText("low")
    expect(badge).toHaveClass("text-chart-error")
    expect(badge).toHaveClass("bg-chart-error/20")
  })

  it("renders EmptyState when data_points < 3", () => {
    vi.mocked(projectionHook.useProjection).mockReturnValue({
      data: {
        ...mockProjectionData,
        data_points: 2,
        history: [{ date: "2026-11-01", cost_usd: 0.5, tokens: 20000 }],
      },
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<CostProjectionWidget />)

    expect(
      screen.getByText("Not enough data for projection — check back after 3 days of usage.")
    ).toBeInTheDocument()
    expect(screen.queryByText("$36.16")).not.toBeInTheDocument()
  })

  it("renders sr-only description present and descriptive", () => {
    vi.mocked(projectionHook.useProjection).mockReturnValue({
      data: mockProjectionData,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<CostProjectionWidget />)

    const srParagraph = screen.getByText(/Projected monthly cost is \$36\.16 with a positive daily trend slope/i)
    expect(srParagraph).toBeInTheDocument()
    expect(srParagraph).toHaveClass("sr-only")
  })
})

