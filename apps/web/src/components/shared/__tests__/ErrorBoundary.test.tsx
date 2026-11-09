import React, { useState } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { ErrorBoundary } from "../ErrorBoundary"

function BombComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Simulated rendering explosion")
  }
  return <div>Component loaded normally</div>
}

function TestContainer() {
  const [explode, setExplode] = useState(true)

  return (
    <div>
      <button type="button" onClick={() => setExplode(false)}>
        Fix Bomb
      </button>
      <ErrorBoundary name="TestWidget">
        <BombComponent shouldThrow={explode} />
      </ErrorBoundary>
    </div>
  )
}

describe("ErrorBoundary Component (ENG-02)", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("catches errors in children and renders accessible alert card", () => {
    render(
      <ErrorBoundary name="AnalyticsWidget">
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    const alert = screen.getByRole("alert")
    expect(alert).toBeInTheDocument()
    expect(screen.getByText("Failed to render AnalyticsWidget")).toBeInTheDocument()
    expect(screen.getByText(/Simulated rendering explosion/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /retry component/i })).toBeInTheDocument()
  })

  it("allows retrying component after resolving error", async () => {
    const user = userEvent.setup()
    render(<TestContainer />)

    expect(screen.getByText("Failed to render TestWidget")).toBeInTheDocument()

    // Fix the condition
    await user.click(screen.getByRole("button", { name: "Fix Bomb" }))

    // Click retry inside error boundary
    await user.click(screen.getByRole("button", { name: /retry component/i }))

    expect(screen.getByText("Component loaded normally")).toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("provides a Report button that copies error information", async () => {
    const user = userEvent.setup()
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    })

    render(
      <ErrorBoundary name="CrashWidget">
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    const reportBtn = screen.getByRole("button", { name: /report/i })
    expect(reportBtn).toBeInTheDocument()

    await user.click(reportBtn)
    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining("[AgentOS Error Report] Component: CrashWidget")
    )
    expect(screen.getByText("Copied!")).toBeInTheDocument()
  })
})

