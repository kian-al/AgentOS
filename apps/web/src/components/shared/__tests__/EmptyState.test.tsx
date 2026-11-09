import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { EmptyState } from "../EmptyState"
import { Activity } from "lucide-react"

describe("EmptyState Component", () => {
  it("renders title, description, and sprint badge", () => {
    render(
      <EmptyState
        title="No Active Agents"
        description="Autonomous agents will appear here once connected."
        sprint="Sprint 3"
      />
    )

    expect(screen.getByText("No Active Agents")).toBeInTheDocument()
    expect(
      screen.getByText("Autonomous agents will appear here once connected.")
    ).toBeInTheDocument()
    expect(screen.getByText("Sprint 3")).toBeInTheDocument()
  })

  it("renders custom icon when passed", () => {
    render(
      <EmptyState
        title="Custom Icon State"
        description="Testing custom icon"
        icon={<Activity data-testid="custom-activity-icon" className="h-6 w-6" />}
      />
    )

    expect(screen.getByTestId("custom-activity-icon")).toBeInTheDocument()
  })

  it("triggers onAction when action button is clicked", async () => {
    const handleAction = vi.fn()
    const user = userEvent.setup()

    render(
      <EmptyState
        title="Actionable State"
        description="Perform action"
        actionLabel="Configure Agents"
        onAction={handleAction}
      />
    )

    const btn = screen.getByRole("button", { name: "Configure Agents" })
    expect(btn).toBeInTheDocument()

    await user.click(btn)
    expect(handleAction).toHaveBeenCalledTimes(1)
  })
})

