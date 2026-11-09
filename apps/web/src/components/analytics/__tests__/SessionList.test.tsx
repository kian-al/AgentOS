import React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { SessionList } from "../SessionList"
import * as sessionsHook from "@/hooks/useSessions"
import * as sessionEventsHook from "@/hooks/useSessionEvents"
import { SessionSummary } from "@/lib/api"

vi.mock("@/hooks/useSessions")
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

const mockSessions: SessionSummary[] = [
  {
    session_id: "sess_alpha_123",
    events: 18,
    tokens: 43210,
    cost_usd: 0.87,
    started_at: "2026-11-07T12:04:00Z",
    ended_at: "2026-11-07T12:08:12Z",
  },
  {
    session_id: "sess_beta_456",
    events: 9,
    tokens: 21500,
    cost_usd: 0.43,
    started_at: "2026-11-07T11:51:00Z",
    ended_at: "2026-11-07T11:51:32Z",
  },
]

describe("SessionList Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(sessionEventsHook.useSessionEvents).mockReturnValue({
      data: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  it("renders rows with accurate metrics and descriptive aria-label", () => {
    vi.mocked(sessionsHook.useSessions).mockReturnValue({
      data: mockSessions,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<SessionList />)

    expect(screen.getByRole("table", { name: /recent sessions table/i })).toBeInTheDocument()
    expect(screen.getByText("2 sessions recorded")).toBeInTheDocument()

    // Row 1
    const row1 = screen.getByLabelText("Open session sess_alpha_123: 18 events, $0.87")
    expect(row1).toBeInTheDocument()
    expect(within(row1).getByText("sess_alpha_123")).toBeInTheDocument()
    expect(within(row1).getByText("43.2K")).toBeInTheDocument()
    expect(within(row1).getByText("$0.87")).toBeInTheDocument()
    expect(within(row1).getByText("4m 12s")).toBeInTheDocument()

    // Row 2
    const row2 = screen.getByLabelText("Open session sess_beta_456: 9 events, $0.43")
    expect(row2).toBeInTheDocument()
    expect(within(row2).getByText("sess_beta_456")).toBeInTheDocument()
    expect(within(row2).getByText("21.5K")).toBeInTheDocument()
    expect(within(row2).getByText("$0.43")).toBeInTheDocument()
    expect(within(row2).getByText("32s")).toBeInTheDocument()
  })

  it("opens SessionDrilldownSheet when row is clicked or activated with Enter key", async () => {
    const user = userEvent.setup()

    vi.mocked(sessionsHook.useSessions).mockReturnValue({
      data: mockSessions,
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<SessionList />)

    const row = screen.getByLabelText("Open session sess_alpha_123: 18 events, $0.87")

    // Test keyboard Enter activation
    row.focus()
    expect(row).toHaveFocus()
    await user.keyboard("{Enter}")

    // Sheet should be opened with session ID title and close button
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Close session drilldown" })).toBeInTheDocument()
  })

  it("renders empty state when data is empty array []", () => {
    vi.mocked(sessionsHook.useSessions).mockReturnValue({
      data: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<SessionList />)

    expect(screen.getByText("No session telemetry recorded")).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })
})

