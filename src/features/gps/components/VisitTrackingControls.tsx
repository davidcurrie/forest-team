import { useVisitTrackingStore } from '../../../store/visitTrackingStore'

interface VisitTrackingControlsProps {
  isGPSTracking: boolean
}

/**
 * Controls for visit tracking feature
 * Allows user to configure visit distance threshold and reset visited controls
 */
export function VisitTrackingControls({ isGPSTracking }: VisitTrackingControlsProps) {
  const {
    visitDistanceThreshold,
    isTrackingEnabled,
    visitedControls,
    setVisitDistanceThreshold,
    setTrackingEnabled,
    resetVisitedControls,
  } = useVisitTrackingStore()

  // Don't show if GPS is not active
  if (!isGPSTracking) {
    return null
  }

  const handleReset = () => {
    if (visitedControls.size === 0) {
      return
    }

    if (confirm(`Reset ${visitedControls.size} visited control${visitedControls.size !== 1 ? 's' : ''}?`)) {
      resetVisitedControls()
    }
  }

  const distanceOptions = [5, 10, 15, 20, 25, 30]

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 min-w-[200px]">
      <div className="text-sm font-semibold text-gray-700 mb-3">
        Visit Tracking
      </div>

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between mb-3">
        <label htmlFor="visit-tracking-toggle" className="text-sm text-gray-600">
          Track visits
        </label>
        <button
          id="visit-tracking-toggle"
          onClick={() => setTrackingEnabled(!isTrackingEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isTrackingEnabled ? 'bg-green-600' : 'bg-gray-300'
          }`}
          aria-label="Toggle visit tracking"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isTrackingEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Distance Threshold Selector */}
      <div className="mb-3">
        <label htmlFor="visit-distance" className="text-sm text-gray-600 block mb-1">
          Visit distance
        </label>
        <select
          id="visit-distance"
          value={visitDistanceThreshold}
          onChange={(e) => setVisitDistanceThreshold(Number(e.target.value))}
          disabled={!isTrackingEnabled}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-forest-500 disabled:bg-gray-100 disabled:text-gray-400"
        >
          {distanceOptions.map((distance) => (
            <option key={distance} value={distance}>
              {distance}m
            </option>
          ))}
        </select>
      </div>

      {/* Visited Count & Reset */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <span className="text-sm text-gray-600">
          Visited: <span className="font-semibold text-green-600">{visitedControls.size}</span>
        </span>
        <button
          onClick={handleReset}
          disabled={visitedControls.size === 0}
          className="px-3 py-1 text-xs font-medium text-white bg-forest-600 rounded hover:bg-forest-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
