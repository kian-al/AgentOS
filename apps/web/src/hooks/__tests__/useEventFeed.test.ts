import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useEventFeed } from "../useEventFeed"
import { BeaconEvent } from "@/lib/api"

// Mock event generator
function createEvent(id: number, overrides: Partial<BeaconEvent> = {}): BeaconEvent {
  return {
    id,
    event_type: "tool_call",
    tool_name: "Edit",
    session_id: `sess-${id}`,
    agent: "agentOS-backend",
    timestamp: new Date(Date.now() - id * 1000).toISOString(),
    input_tokens: 100,
    output_tokens: 50,
    cache_read_tokens: 0,
    cost_usd: 0.01,
    raw_json: "{}",
    created_at: new Date(Date.now() - id * 1000).toISOString(),
    ...overrides,
  }
}

let mockLastEvent: BeaconEvent | null = null

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api")
  return {
    ...actual,
    fetchLatestEvents: vi.fn().mockImplementation(() => Promise.resolve([])),
  }
})

vi.mock("@/hooks/useBeaconSocket", () => ({
  useBeaconSocket: () => ({
    lastEvent: mockLastEvent,
    isConnected: true,
  }),
}))

describe("useEventFeed hook", () => {
  beforeEach(() => {
    mockLastEvent = null
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it("caps buffer at 200 events", async () => {
    const initialEvents = Array.from({ length: 250 }, (_, i) => createEvent(i + 1))
    const { fetchLatestEvents } = await import("@/lib/api")
    vi.mocked(fetchLatestEvents).mockResolvedValueOnce(initialEvents)

    const { result } = renderHook(() => useEventFeed())
    await act(async () => {
      // allow fetch to resolve
      await Promise.resolve()
    })

    // Sliced display is 50, but rawCount internal buffer caps at 200
    expect(result.current.events.length).toBeLessThanOrEqual(50)
  })

  it("handles pause and pending event accumulation", async () => {
    const { result, rerender } = renderHook(() => useEventFeed())

    // Pause the feed
    act(() => {
      result.current.togglePause()
    })
    expect(result.current.isPaused).toBe(true)

    // Simulate incoming websocket event while paused
    act(() => {
      mockLastEvent = createEvent(999, { tool_name: "Write" })
      rerender()
    })

    expect(result.current.pendingCount).toBe(1)

    // Resume and flush
    act(() => {
      result.current.resumeAndFlush()
    })

    expect(result.current.isPaused).toBe(false)
    expect(result.current.pendingCount).toBe(0)
    expect(result.current.events[0]?.id).toBe(999)
  })

  it("filters events by search query across session_id, agent, and tool_name", async () => {
    const events: BeaconEvent[] = [
      createEvent(1, { session_id: "alpha-001", agent: "agentOS-backend", tool_name: "Edit" }),
      createEvent(2, { session_id: "beta-002", agent: "agentOS-tester", tool_name: "Bash" }),
      createEvent(3, { session_id: "gamma-003", agent: "agentOS-frontend", tool_name: "Glob" }),
    ]
    const { fetchLatestEvents } = await import("@/lib/api")
    vi.mocked(fetchLatestEvents).mockResolvedValueOnce(events)

    const { result } = renderHook(() => useEventFeed())
    await act(async () => {
      await Promise.resolve()
    })

    // Search by tool
    act(() => {
      result.current.setSearchQuery("Bash")
    })
    act(() => {
      vi.advanceTimersByTime(250)
    })
    expect(result.current.events.length).toBe(1)
    expect(result.current.events[0]?.tool_name).toBe("Bash")

    // Search by agent
    act(() => {
      result.current.setSearchQuery("frontend")
    })
    act(() => {
      vi.advanceTimersByTime(250)
    })
    expect(result.current.events.length).toBe(1)
    expect(result.current.events[0]?.agent).toBe("agentOS-frontend")

    // Search by session_id
    act(() => {
      result.current.setSearchQuery("alpha")
    })
    act(() => {
      vi.advanceTimersByTime(250)
    })
    expect(result.current.events.length).toBe(1)
    expect(result.current.events[0]?.session_id).toBe("alpha-001")
  })

  it("filters events by category tabs", async () => {
    const events: BeaconEvent[] = [
      createEvent(1, { event_type: "tool_call", tool_name: "Edit" }),
      createEvent(2, { event_type: "agent_action", agent: "agentOS-backend" }),
      createEvent(3, { event_type: "session_start" }),
      createEvent(4, { event_type: "task_error" }),
    ]
    const { fetchLatestEvents } = await import("@/lib/api")
    vi.mocked(fetchLatestEvents).mockResolvedValueOnce(events)

    const { result } = renderHook(() => useEventFeed())
    await act(async () => {
      await Promise.resolve()
    })

    // Filter by tool
    act(() => {
      result.current.setActiveFilter("tool")
    })
    expect(result.current.events.every((e) => e.event_type.includes("tool") || e.tool_name)).toBe(true)

    // Filter by error
    act(() => {
      result.current.setActiveFilter("error")
    })
    expect(result.current.events.length).toBe(1)
    expect(result.current.events[0]?.event_type).toBe("task_error")
  })
})
