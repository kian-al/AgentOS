import { describe, it, expect } from "vitest"
import { formatTokens, formatUsd, formatDelta } from "../format"

describe("formatTokens", () => {
  it("formats zero and standard numbers", () => {
    expect(formatTokens(0)).toBe("0")
    expect(formatTokens(999)).toBe("999")
  })

  it("formats thousands with 1.0K resolution", () => {
    expect(formatTokens(1000)).toBe("1.0K")
    expect(formatTokens(184200)).toBe("184.2K")
  })

  it("formats millions with 1 decimal place", () => {
    expect(formatTokens(1_250_000)).toBe("1.3M")
    expect(formatTokens(1_400_000)).toBe("1.4M")
  })

  it("handles negative numbers properly", () => {
    expect(formatTokens(-500)).toBe("-500")
    expect(formatTokens(-1000)).toBe("-1.0K")
  })

  it("handles null and undefined safely", () => {
    expect(formatTokens(null)).toBe("0")
    expect(formatTokens(undefined)).toBe("0")
  })
})

describe("formatUsd", () => {
  it("formats zero as currency", () => {
    expect(formatUsd(0)).toBe("$0.00")
  })

  it("rounds to 2 decimal places", () => {
    expect(formatUsd(4.3712)).toBe("$4.37")
  })

  it("formats larger numbers with comma separators", () => {
    expect(formatUsd(1240)).toBe("$1,240.00")
  })

  it("handles null and undefined gracefully", () => {
    expect(formatUsd(null)).toBe("$0.00")
    expect(formatUsd(undefined)).toBe("$0.00")
  })
})

describe("formatDelta", () => {
  it("formats positive delta with upward arrow", () => {
    const delta = formatDelta(12)
    expect(delta.text).toBe("▲ 12%")
    expect(delta.direction).toBe("up")
    expect(delta.color).toBe("emerald")
    expect(String(delta)).toBe("▲ 12%")
  })

  it("formats negative delta with downward arrow", () => {
    const delta = formatDelta(-3)
    expect(delta.text).toBe("▼ 3%")
    expect(delta.direction).toBe("down")
    expect(delta.color).toBe("rose")
    expect(String(delta)).toBe("▼ 3%")
  })

  it("formats zero delta with neutral dash", () => {
    const delta = formatDelta(0)
    expect(delta.text).toBe("—")
    expect(delta.direction).toBe("neutral")
    expect(delta.color).toBe("slate")
    expect(String(delta)).toBe("—")
  })

  it("handles null and undefined with neutral dash", () => {
    const deltaNull = formatDelta(null)
    expect(deltaNull.text).toBe("—")
    expect(deltaNull.direction).toBe("neutral")

    const deltaUndef = formatDelta(undefined)
    expect(deltaUndef.text).toBe("—")
    expect(deltaUndef.direction).toBe("neutral")
  })
})

