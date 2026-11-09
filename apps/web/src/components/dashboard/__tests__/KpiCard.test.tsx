import React from "react"
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { KpiCard } from "../KpiCard"
import { DeltaInfo } from "@/lib/format"

describe("KpiCard component", () => {
  it("renders skeleton placeholder when loading is true", () => {
    render(
      <KpiCard
        title="Tokens Today"
        value="184.2K"
        icon={<span data-testid="test-icon" />}
        loading={true}
      />
    )

    expect(screen.getByLabelText("Loading metric value")).toBeInTheDocument()
    expect(screen.queryByText("184.2K")).not.toBeInTheDocument()
  })

  it("renders metric value and delta badge when loaded", () => {
    const delta: DeltaInfo = {
      text: "▲ 12%",
      direction: "up",
      color: "emerald",
      toString() {
        return this.text
      },
    }

    render(
      <KpiCard
        title="Tokens Today"
        value="184.2K"
        icon={<span data-testid="test-icon" />}
        delta={delta}
        deltaLabel="vs yesterday"
        loading={false}
      />
    )

    expect(screen.getByText("Tokens Today")).toBeInTheDocument()
    expect(screen.getByText("184.2K")).toBeInTheDocument()
    expect(screen.getByText("vs yesterday")).toBeInTheDocument()
  })

  it("ensures delta arrows are aria-hidden and sr-only text is present for accessibility", () => {
    const delta: DeltaInfo = {
      text: "▲ 12%",
      direction: "up",
      color: "emerald",
      toString() {
        return this.text
      },
    }

    render(
      <KpiCard
        title="Tokens Today"
        value="184.2K"
        icon={<span />}
        delta={delta}
      />
    )

    // Visual arrow must be aria-hidden
    const arrow = screen.getByText("▲")
    expect(arrow).toHaveAttribute("aria-hidden", "true")

    // Screen reader accessible explanation must be present
    const srOnly = screen.getByText("increased by 12%")
    expect(srOnly).toHaveClass("sr-only")
  })

  it("renders live status indicator with pulsing dot", () => {
    render(
      <KpiCard
        title="Sessions Active"
        value={2}
        icon={<span />}
        isLive={true}
      />
    )

    expect(screen.getByText("live")).toBeInTheDocument()
  })
})

