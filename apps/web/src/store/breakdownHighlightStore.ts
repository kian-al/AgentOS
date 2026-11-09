import { create } from "zustand"

interface BreakdownHighlightState {
  highlightedKey: string | null
  highlightedIndex: number | null
  setHighlight: (key: string | null, index?: number | null) => void
  clearHighlight: () => void
}

/**
 * Shared hover/focus highlight store between ModelBreakdown (donut)
 * and AgentBreakdown (bars) panels.
 */
export const useBreakdownHighlightStore = create<BreakdownHighlightState>((set) => ({
  highlightedKey: null,
  highlightedIndex: null,
  setHighlight: (key, index = null) => set({ highlightedKey: key, highlightedIndex: index }),
  clearHighlight: () => set({ highlightedKey: null, highlightedIndex: null }),
}))

