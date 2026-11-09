import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { SessionDrilldownSheet } from "../SessionDrilldownSheet"
import * as sessionEventsHook from "@/hooks/useSessionEvents"
import { SessionEvent } from "@/lib/api"

vi.mock("@/hooks/useSessionEvents")

vi.mock("recharts", async () => {
  const original = await vi.importActual<typeof import("recharts")>("recharts")
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 400, height: 200 }}>{children}</div>
    ),
  }
})

const mockEvents: SessionEvent[] = [
  {
    id: 101,
    event_type: "tool_use",
    agent: "agentOS-frontend",
    model: "claude-opus-4",
    tool_name: "Edit",
    token_usage_input: 1200,
    token_usage_output: 450,
    token_usage_cache_read: 200,
    cost_usd: 0.12,
    timestamp: "2026-11-07T12:04:10Z",
  },
  {
    id: 102,
    event_type: "agent_turn",
    agent: "agentOS-backend",
    model: "claude-opus-4",
    tool_name: "",
    token_usage_input: 800,
    token_usage_output: 300,
    token_usage_cache_read: 0,
    cost_usd: 0.08,
    timestamp: "2026-11-07T12:05:00Z",
  },
]

describe("SessionDrilldownSheet Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders all event rows, total cost, and sr-only caption", () => {
    vi.mocked(sessionEventsHook.useSessionEvents).mockReturnValue({
      data: mockEvents,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <SessionDrilldownSheet
        sessionId="sess_a1b2c3d4"
        open={true}
        onClose={vi.fn()}
        totalCost={0.87}
      />
    )

    // Header & Badges
    expect(screen.getByText("sess_a1b2c3d4")).toBeInTheDocument()
    expect(screen.getByText("Total: $0.87")).toBeInTheDocument()

    // Accessible close button
    const closeBtn = screen.getByRole("button", { name: "Close session drilldown" })
    expect(closeBtn).toBeInTheDocument()

    // Accessible table & sr-only caption
    expect(screen.getByText("Events for session sess_a1b2c3d4")).toBeInTheDocument()

    // Table rows
    expect(screen.getByText("agentOS-frontend")).toBeInTheDocument()
    expect(screen.getByText("agentOS-backend")).toBeInTheDocument()
    expect(screen.getByText("Edit")).toBeInTheDocument()
    expect(screen.getByText("$0.12")).toBeInTheDocument()
    expect(screen.getByText("$0.08")).toBeInTheDocument()
  })

  it("invokes onClose when the close button is clicked", async () => {
    const user = userEvent.setup()
    const onCloseMock = vi.fn()

    vi.mocked(sessionEventsHook.useSessionEvents).mockReturnValue({
      data: mockEvents,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(
      <SessionDrilldownSheet
        sessionId="sess_test"
        open={true}
        onClose={onCloseMock}
      />
    )

    const closeBtn = screen.getByRole("button", { name: "Close session drilldown" })
    await user.click(closeBtn)

    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })
})

