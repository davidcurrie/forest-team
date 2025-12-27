import { create } from 'zustand'

interface VisitTrackingState {
  visitedControls: Set<string>
  visitDistanceThreshold: number // meters
  isTrackingEnabled: boolean

  // Actions
  markControlAsVisited: (controlId: string) => void
  resetVisitedControls: () => void
  setVisitDistanceThreshold: (distance: number) => void
  setTrackingEnabled: (enabled: boolean) => void
  isControlVisited: (controlId: string) => boolean
}

/**
 * Store for tracking visited controls during GPS navigation
 */
export const useVisitTrackingStore = create<VisitTrackingState>((set, get) => ({
  visitedControls: new Set<string>(),
  visitDistanceThreshold: 10, // Default 10 meters
  isTrackingEnabled: true, // Enabled by default when GPS is on

  markControlAsVisited: (controlId: string) => {
    set((state) => {
      const newVisited = new Set(state.visitedControls)
      newVisited.add(controlId)
      return { visitedControls: newVisited }
    })
  },

  resetVisitedControls: () => {
    set({ visitedControls: new Set<string>() })
  },

  setVisitDistanceThreshold: (distance: number) => {
    set({ visitDistanceThreshold: distance })
  },

  setTrackingEnabled: (enabled: boolean) => {
    set({ isTrackingEnabled: enabled })
  },

  isControlVisited: (controlId: string) => {
    return get().visitedControls.has(controlId)
  },
}))
