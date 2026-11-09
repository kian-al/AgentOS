import { describe, it, expect } from "vitest"
import { getEventCategory } from "../eventTypes"
import { BeaconEvent } from "../api"

describe("getEventCategory", () => {
  it("maps error and failure events to ERROR category with chart token class", () => {
    const errorEvt: BeaconEvent = {
      id: 1,
      event_type: "execution_error",
      session_id: "s1",
      timestamp: "2026-11-05T12:00:00Z",
      input_tokens: 0,
      output_tokens: 0,
      cache_read_tokens: 0,
      cost_usd: 0,
      raw_json: "{}",
      created_at: "2026-11-05T12:00:00Z",
    }
    const res = getEventCategory(errorEvt)
    expect(res.category).toBe("ERROR")
    expect(res.label).toBe("ERROR")
    expect(res.badgeClass).toContain("bg-chart-error/15")
    expect(res.badgeClass).toContain("text-chart-error")
  })

  it("maps tool invocations to TOOL category with chart token class", () => {
    const toolEvt: BeaconEvent = {
      id: 2,
      event_type: "tool_call",
      tool_name: "Edit",
      session_id: "s1",
      timestamp: "2026-11-05T12:00:00Z",
      input_tokens: 100,
      output_tokens: 50,
      cache_read_tokens: 0,
      cost_usd: 0.01,
      raw_json: "{}",
      created_at: "2026-11-05T12:00:00Z",
    }
    const res = getEventCategory(toolEvt)
    expect(res.category).toBe("TOOL")
    expect(res.label).toBe("TOOL")
    expect(res.badgeClass).toContain("bg-chart-tool/15")
  })

  it("maps session events to SESSION category with chart token class", () => {
    const sessionEvt: BeaconEvent = {
      id: 3,
      event_type: "session_start",
      session_id: "s2",
      timestamp: "2026-11-05T12:00:00Z",
      input_tokens: 0,
      output_tokens: 0,
      cache_read_tokens: 0,
      cost_usd: 0,
      raw_json: "{}",
      created_at: "2026-11-05T12:00:00Z",
    }
    const res = getEventCategory(sessionEvt)
    expect(res.category).toBe("SESSION")
    expect(res.label).toBe("SESSION")
    expect(res.badgeClass).toContain("bg-chart-session/15")
  })

  it("maps agent actions to AGENT category with chart token class", () => {
    const agentEvt: BeaconEvent = {
      id: 4,
      event_type: "agent_action",
      agent: "agentOS-backend",
      session_id: "s3",
      timestamp: "2026-11-05T12:00:00Z",
      input_tokens: 200,
      output_tokens: 100,
      cache_read_tokens: 0,
      cost_usd: 0.02,
      raw_json: "{}",
      created_at: "2026-11-05T12:00:00Z",
    }
    const res = getEventCategory(agentEvt)
    expect(res.category).toBe("AGENT")
    expect(res.label).toBe("AGENT")
    expect(res.badgeClass).toContain("bg-chart-agent/15")
  })

  it("safely handles unknown event_type without crashing", () => {
    const unknownEvt: BeaconEvent = {
      id: 5,
      event_type: "unknown_custom_telemetry_type",
      session_id: "s4",
      timestamp: "2026-11-05T12:00:00Z",
      input_tokens: 0,
      output_tokens: 0,
      cache_read_tokens: 0,
      cost_usd: 0,
      raw_json: "{}",
      created_at: "2026-11-05T12:00:00Z",
    }
    const res = getEventCategory(unknownEvt)
    expect(res.category).toBe("AGENT")
    expect(res.badgeClass).toBeDefined()
  })
})

