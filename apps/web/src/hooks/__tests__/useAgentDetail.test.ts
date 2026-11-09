import { renderHook, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useAgentDetail } from "../useAgentDetail"
import * as api from "@/lib/api"

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof api>("@/lib/api")
  return {
    ...actual,
    fetchAgentDetail: vi.fn(),
  }
})

const mockDetail: api.AgentDetail = {
  config: {
    name: "agentOS-tester",
    description: "Runs full verification suites.",
    tools: ["Bash", "Read"],
    file_path: ".claude/agents/agentOS-tester.md",
    updated_at: "2026-11-05T16:28:00Z",
  },
  stats: {
    total_tokens: 50000,
    total_cost_usd: 0.75,
    total_events: 12,
    last_seen: "2026-11-08T09:00:00Z",
  },
}

describe("useAgentDetail Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("does not fetch when name is null", async () => {
    const { result } = renderHook(() => useAgentDetail(null))

    expect(result.current.data).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(api.fetchAgentDetail).not.toHaveBeenCalled()
  })

  it("fetches agent detail on mount when name is provided", async () => {
    vi.mocked(api.fetchAgentDetail).mockResolvedValue(mockDetail)

    const { result } = renderHook(() => useAgentDetail("agentOS-tester"))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual(mockDetail)
    expect(result.current.error).toBeNull()
    expect(api.fetchAgentDetail).toHaveBeenCalledWith("agentOS-tester")
  })

  it("sets up polling interval while active and clears interval on unmount", async () => {
    vi.mocked(api.fetchAgentDetail).mockResolvedValue(mockDetail)
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval")

    const { unmount } = renderHook(() => useAgentDetail("agentOS-tester"))

    await waitFor(() => {
      expect(api.fetchAgentDetail).toHaveBeenCalledWith("agentOS-tester")
    })

    // Unmount and verify clearInterval was called (ENG-04 cleanup)
    unmount()
    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})
