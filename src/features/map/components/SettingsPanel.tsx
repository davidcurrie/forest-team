import { useState, useEffect } from 'react'
import { Course } from '../../../shared/types'
import { useVisitTrackingStore } from '../../../store/visitTrackingStore'

interface SettingsPanelProps {
  courses: Course[]
  onToggleCourse: (courseId: string) => void
  onToggleAll: (visible: boolean) => void
  isGPSTracking: boolean
  onToggleGPS: () => void
  gpsError: string | null
}

/**
 * Settings panel containing course selection and visit tracking controls
 * Accessible via a settings button to reduce UI clutter on mobile
 */
export function SettingsPanel({
  courses,
  onToggleCourse,
  onToggleAll,
  isGPSTracking,
  onToggleGPS,
  gpsError,
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const allVisible = courses.every(c => c.visible)
  const someVisible = courses.some(c => c.visible)

  // Visit tracking state
  const {
    visitDistanceThreshold,
    visitedControls,
    setVisitDistanceThreshold,
    setTrackingEnabled,
    resetVisitedControls,
  } = useVisitTrackingStore()

  // Automatically enable/disable visit tracking when GPS changes
  useEffect(() => {
    setTrackingEnabled(isGPSTracking)
  }, [isGPSTracking, setTrackingEnabled])

  const handleReset = () => {
    if (visitedControls.size === 0) return

    if (confirm(`Reset ${visitedControls.size} visited control${visitedControls.size !== 1 ? 's' : ''}?`)) {
      resetVisitedControls()
    }
  }

  const distanceOptions = [5, 10, 15, 20, 25, 30]

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-forest-600 text-white rounded-lg shadow-lg px-3 py-2 hover:bg-forest-700 transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2"
        aria-label="Open settings"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6" />
          <path d="M4.5 12H1m22 0h-3.5" />
          <path d="M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24" />
          <path d="M18.36 5.64l-4.24 4.24m-4.24 4.24l-4.24 4.24" />
        </svg>
        <span className="text-sm font-medium">Settings</span>
      </button>

      {/* Settings Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
            }}
          />

          {/* Settings Panel - Completely scrollable */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              maxWidth: '384px',
              height: '100%',
              backgroundColor: 'white',
              zIndex: 1000,
              overflowY: 'scroll',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Header */}
            <div className="bg-green-700 text-white p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Settings</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded text-white cursor-pointer hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Close settings"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* GPS & Visit Tracking Section */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  GPS & Visit Tracking
                </h3>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  {gpsError && (
                    <div className="p-3 rounded bg-red-100 border border-red-300 mb-4">
                      <p className="text-sm text-red-800">{gpsError}</p>
                    </div>
                  )}

                  {/* GPS Toggle */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="text-sm font-medium text-gray-900 mb-3">GPS Tracking</div>
                    <button
                      onClick={onToggleGPS}
                      className="w-full relative rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                      style={{
                        height: '48px',
                        backgroundColor: isGPSTracking ? '#2563eb' : '#9ca3af'
                      }}
                      aria-label="Toggle GPS tracking"
                    >
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-base font-semibold text-white">
                          {isGPSTracking ? 'GPS ON' : 'GPS OFF'}
                        </span>
                      </div>
                    </button>
                    <div className="text-xs text-gray-500 mt-2">
                      {isGPSTracking ? 'Location tracking and visit detection active' : 'Enable to track location and mark visited controls'}
                    </div>
                  </div>

                  {/* Distance Threshold */}
                  <div className="mb-4">
                    <label htmlFor="visit-distance" className="text-sm text-gray-500 block mb-2">
                      Visit distance threshold
                    </label>
                    <select
                      id="visit-distance"
                      value={visitDistanceThreshold}
                      onChange={(e) => setVisitDistanceThreshold(Number(e.target.value))}
                      disabled={!isGPSTracking}
                      className={`w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        !isGPSTracking
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white cursor-pointer'
                      }`}
                    >
                      {distanceOptions.map((distance) => (
                        <option key={distance} value={distance}>
                          {distance}m
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Visited Count & Reset */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-500">
                      Visited: <span className="font-semibold text-blue-600">{visitedControls.size}</span>
                    </span>
                    <button
                      onClick={handleReset}
                      disabled={visitedControls.size === 0 || !isGPSTracking}
                      className={`px-4 py-2 text-sm font-medium text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        visitedControls.size === 0 || !isGPSTracking
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                      }`}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Course Selection Section */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Courses
                </h3>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  {/* Show/Hide All Buttons */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => onToggleAll(true)}
                      disabled={allVisible}
                      className={`flex-1 px-3 py-2 text-sm text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        allVisible
                          ? 'bg-gray-400 cursor-not-allowed opacity-50'
                          : 'bg-green-700 hover:bg-green-800 cursor-pointer'
                      }`}
                    >
                      Show All
                    </button>
                    <button
                      onClick={() => onToggleAll(false)}
                      disabled={!someVisible}
                      className={`flex-1 px-3 py-2 text-sm text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                        !someVisible
                          ? 'bg-gray-400 cursor-not-allowed opacity-50'
                          : 'bg-gray-600 hover:bg-gray-700 cursor-pointer'
                      }`}
                    >
                      Hide All
                    </button>
                  </div>

                  {/* Course List */}
                  {courses.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No courses available</p>
                  ) : (
                    <div>
                      {courses.map(course => (
                        <label
                          key={course.id}
                          className="flex items-center gap-3 px-3 py-2 rounded cursor-pointer min-h-touch hover:bg-gray-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={course.visible}
                            onChange={() => onToggleCourse(course.id)}
                            className="w-5 h-5 cursor-pointer"
                          />
                          <div
                            style={{
                              backgroundColor: course.color,
                              width: '32px',
                              height: '32px',
                              flexShrink: 0
                            }}
                            className="border border-gray-300"
                            aria-label={`Course color: ${course.color}`}
                          />
                          <span className="text-sm flex-1">{course.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
