import { renderHook, waitFor, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useBreakdown } from "../useBreakdown"
import * as api from "@/lib/api"
import { useRangeStore } from "@/store/rangeStore"

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...actual,
    fetchBreakdown: vi.fn(),
  }
})

vi.mock("@/hooks/useBeaconSocket", () => ({
  useBeaconSocket: () => ({ isConnected: true, lastEvent: null }),
}))

describe("useBreakdown hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useRangeStore.setState({ range: "24h" })
  })

  it("fetches breakdown items on mount for model dimension", async () => {
    const mockData: api.BreakdownItem[] = [
      { key: "claude-3-5-sonnet", tokens: 10000, cost_usd: 0.15, events: 5, pct: 60 },
      { key: "claude-haiku-3", tokens: 5000, cost_usd: 0.05, events: 10, pct: 40 },
    ]
    vi.mocked(api.fetchBreakdown).mockResolvedValueOnce(mockData)

    const { result } = renderHook(() => useBreakdown("model"))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBeNull()
    expect(api.fetchBreakdown).toHaveBeenCalledWith("model", "24h")
  })

  it("refetches when global range store changes", async () => {
    const mockData24h: api.BreakdownItem[] = [
      { key: "agentOS-backend", tokens: 1000, cost_usd: 0.02, events: 2, pct: 100 },
    ]
    const mockData7d: api.BreakdownItem[] = [
      { key: "agentOS-backend", tokens: 5000, cost_usd: 0.1, events: 10, pct: 100 },
    ]

    vi.mocked(api.fetchBreakdown)
      .mockResolvedValueOnce(mockData24h)
      .mockResolvedValueOnce(mockData7d)

    const { result } = renderHook(() => useBreakdown("agent"))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.data).toEqual(mockData24h)

    act(() => {
      useRangeStore.getState().setRange("7d")
    })

    await waitFor(() => {
      expect(api.fetchBreakdown).toHaveBeenCalledWith("agent", "7d")
      expect(result.current.data).toEqual(mockData7d)
    })
  })

  it("handles fetch failure gracefully", async () => {
    vi.mocked(api.fetchBreakdown).mockRejectedValueOnce(new Error("Network offline"))

    const { result } = renderHook(() => useBreakdown("model"))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeDefined()
    expect(result.current.error?.message).toContain("Network offline")
    expect(result.current.data).toEqual([])
  })
})

