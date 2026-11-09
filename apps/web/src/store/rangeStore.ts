import { create } from "zustand"

export type TimeRange = "24h" | "7d" | "30d" | "90d" | "180d"

interface RangeStoreState {
  range: TimeRange
  setRange: (range: TimeRange) => void
}

/**
 * Global time-range store shared across overview timeline (Story 1.2)
 * and breakdown panels (Story 1.4).
 */
export const useRangeStore = create<RangeStoreState>((set) => ({
  range: "24h",
  setRange: (range: TimeRange) => set({ range }),
}))

