import { useState } from 'react'
import { useVisitTrackingStore } from '../../../store/visitTrackingStore'

interface VisitTrackingControlsProps {
  isGPSTracking: boolean
}

/**
 * Controls for visit tracking feature
 * Allows user to configure visit distance threshold and reset visited controls
 */
export function VisitTrackingControls({ isGPSTracking }: VisitTrackingControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true)
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
    <div
      className="bg-white rounded-lg shadow-lg min-w-[220px]"
      style={{ backgroundColor: 'white', opacity: 1, pointerEvents: 'auto' }}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-outdoor-base">Visit Tracking</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              {isExpanded ? (
                <path d="M5 8l5 5 5-5H5z" />
              ) : (
                <path d="M8 5l5 5-5 5V5z" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Content - only show when expanded */}
      {isExpanded && (
        <div className="p-3">
          {/* Enable/Disable Status with prominent indicator */}
          <div className="mb-3 p-2 rounded" style={{ backgroundColor: isTrackingEnabled ? '#dcfce7' : '#f3f4f6' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isTrackingEnabled ? '#22c55e' : '#9ca3af' }}
                />
                <span className="text-sm font-medium" style={{ color: isTrackingEnabled ? '#166534' : '#6b7280' }}>
                  {isTrackingEnabled ? 'Tracking Active' : 'Tracking Paused'}
                </span>
              </div>
              <button
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
            {!isTrackingEnabled && (
              <p className="text-xs text-gray-600 mt-1">
                Enable to mark controls as visited
              </p>
            )}
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
      )}
    </div>
  )
}
