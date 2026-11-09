import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { DataTooltip, DataTooltipContent } from "../DataTooltip"

describe("DataTooltip Components", () => {
  it("renders trigger element and reveals tooltip on mouseEnter / focus", () => {
    render(
      <DataTooltip label="Total Tokens" content="12,500" subtext="Across 4 models">
        <button type="button">Metric Info</button>
      </DataTooltip>
    )

    expect(screen.getByText("Metric Info")).toBeInTheDocument()
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()

    // Hover reveals tooltip
    fireEvent.mouseEnter(screen.getByText("Metric Info"))
    const tooltip = screen.getByRole("tooltip")
    expect(tooltip).toBeInTheDocument()
    expect(screen.getByText("Total Tokens")).toBeInTheDocument()
    expect(screen.getByText("12,500")).toBeInTheDocument()
    expect(screen.getByText("Across 4 models")).toBeInTheDocument()

    // Leave hides tooltip
    fireEvent.mouseLeave(screen.getByText("Metric Info"))
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
  })

  it("renders DataTooltipContent with title, badge, items, and footer", () => {
    render(
      <DataTooltipContent
        title="Session Telemetry"
        badge={<span>$1.25</span>}
        items={[
          { label: "Input", value: "8,000", indicatorClass: "bg-chart-input" },
          { label: "Output", value: "2,500", indicatorClass: "bg-chart-output" },
        ]}
        footer={<div>Total: 10,500 tokens</div>}
      />
    )

    expect(screen.getByTestId("data-tooltip-content")).toBeInTheDocument()
    expect(screen.getByText("Session Telemetry")).toBeInTheDocument()
    expect(screen.getByText("$1.25")).toBeInTheDocument()
    expect(screen.getByText("Input:")).toBeInTheDocument()
    expect(screen.getByText("8,000")).toBeInTheDocument()
    expect(screen.getByText("Output:")).toBeInTheDocument()
    expect(screen.getByText("2,500")).toBeInTheDocument()
    expect(screen.getByText("Total: 10,500 tokens")).toBeInTheDocument()
  })
})

