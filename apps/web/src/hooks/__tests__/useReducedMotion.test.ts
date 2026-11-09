import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useReducedMotion } from "../useReducedMotion"

describe("useReducedMotion hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns false by default when prefers-reduced-motion is false", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  it("returns true when prefers-reduced-motion matches", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  it("updates when media query change listener triggers", () => {
    let listenerCallback: ((e: MediaQueryListEvent) => void) | null = null

    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event, callback) => {
        if (event === "change") {
          listenerCallback = callback
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)

    act(() => {
      if (listenerCallback) {
        listenerCallback({ matches: true } as MediaQueryListEvent)
      }
    })

    expect(result.current).toBe(true)
  })
})

