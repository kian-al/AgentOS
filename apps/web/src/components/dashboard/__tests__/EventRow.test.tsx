import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { EventRow } from "../EventRow"
import { BeaconEvent } from "@/lib/api"

const mockEvent: BeaconEvent = {
  id: 42,
  event_type: "tool_call",
  tool_name: "Edit",
  agent: "agentOS-backend",
  model: "claude-3-5-sonnet",
  session_id: "sess-100",
  timestamp: "2026-11-05T14:32:00Z",
  input_tokens: 1500,
  output_tokens: 600,
  cache_read_tokens: 200,
  cost_usd: 0.015,
  raw_json: "{}",
  created_at: "2026-11-05T14:32:00Z",
}

describe("EventRow", () => {
  it("renders with a descriptive aria-label", () => {
    const handleSelect = vi.fn()
    render(<EventRow event={mockEvent} onSelect={handleSelect} />)

    const row = screen.getByRole("article")
    expect(row).toBeInTheDocument()
    expect(row).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Open details for event 42: TOOL by agentOS-backend")
    )
  })

  it("is reachable via keyboard tab navigation", async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    render(<EventRow event={mockEvent} onSelect={handleSelect} />)

    const row = screen.getByRole("article")
    expect(row).not.toHaveFocus()

    await user.tab()
    expect(row).toHaveFocus()
  })

  it("triggers onSelect when Enter key is pressed", async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    render(<EventRow event={mockEvent} onSelect={handleSelect} />)

    const row = screen.getByRole("article")
    await user.tab()
    expect(row).toHaveFocus()

    await user.keyboard("{Enter}")
    expect(handleSelect).toHaveBeenCalledTimes(1)
    expect(handleSelect).toHaveBeenCalledWith(mockEvent)
  })

  it("triggers onSelect when Space key is pressed", async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()
    render(<EventRow event={mockEvent} onSelect={handleSelect} />)

    const row = screen.getByRole("article")
    await user.tab()
    expect(row).toHaveFocus()

    await user.keyboard(" ")
    expect(handleSelect).toHaveBeenCalledTimes(1)
    expect(handleSelect).toHaveBeenCalledWith(mockEvent)
  })
})

