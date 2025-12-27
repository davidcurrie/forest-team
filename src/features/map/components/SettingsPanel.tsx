import { useState } from 'react'
import { Course } from '../../../shared/types'
import { useVisitTrackingStore } from '../../../store/visitTrackingStore'

interface SettingsPanelProps {
  courses: Course[]
  onToggleCourse: (courseId: string) => void
  onToggleAll: (visible: boolean) => void
  isGPSTracking: boolean
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
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const allVisible = courses.every(c => c.visible)
  const someVisible = courses.some(c => c.visible)

  // Visit tracking state
  const {
    visitDistanceThreshold,
    isTrackingEnabled,
    visitedControls,
    setVisitDistanceThreshold,
    setTrackingEnabled,
    resetVisitedControls,
  } = useVisitTrackingStore()

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
        className="bg-white rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-colors"
        style={{ backgroundColor: 'white', opacity: 1, pointerEvents: 'auto' }}
        aria-label="Settings"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6m-7-9h6m6 0h6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
        </svg>
      </button>

      {/* Settings Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
            style={{ pointerEvents: 'auto' }}
          />

          {/* Panel */}
          <div
            className="fixed inset-y-0 left-0 w-full sm:w-96 bg-white shadow-xl z-50 overflow-y-auto"
            style={{ pointerEvents: 'auto' }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-forest-700 text-white p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Settings</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-forest-600 rounded"
                aria-label="Close settings"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Course Selection Section */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Courses
                </h3>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  {/* Show/Hide All Buttons */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => onToggleAll(true)}
                      disabled={allVisible}
                      className="flex-1 px-3 py-2 text-sm bg-forest-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-forest-700"
                    >
                      Show All
                    </button>
                    <button
                      onClick={() => onToggleAll(false)}
                      disabled={!someVisible}
                      className="flex-1 px-3 py-2 text-sm bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                    >
                      Hide All
                    </button>
                  </div>

                  {/* Course List */}
                  {courses.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No courses available</p>
                  ) : (
                    <div className="space-y-1">
                      {courses.map(course => (
                        <label
                          key={course.id}
                          className="flex items-center gap-3 py-2 px-3 rounded hover:bg-gray-50 cursor-pointer"
                          style={{ minHeight: '44px' }}
                        >
                          <input
                            type="checkbox"
                            checked={course.visible}
                            onChange={() => onToggleCourse(course.id)}
                            className="w-5 h-5 rounded border-gray-300 text-forest-600 focus:ring-forest-500"
                          />
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              backgroundColor: course.color,
                              borderRadius: '3px',
                              border: '1px solid rgba(0,0,0,0.1)',
                              flexShrink: 0,
                            }}
                            aria-label={`Course color: ${course.color}`}
                          />
                          <span className="text-sm flex-1">{course.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Visit Tracking Section - only show when GPS is active */}
              {isGPSTracking && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Visit Tracking
                  </h3>
                  <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                    {/* Enable/Disable Status */}
                    <div className="p-3 rounded" style={{ backgroundColor: isTrackingEnabled ? '#dcfce7' : '#f3f4f6' }}>
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

                    {/* Distance Threshold */}
                    <div>
                      <label htmlFor="visit-distance" className="text-sm text-gray-600 block mb-2">
                        Visit distance
                      </label>
                      <select
                        id="visit-distance"
                        value={visitDistanceThreshold}
                        onChange={(e) => setVisitDistanceThreshold(Number(e.target.value))}
                        disabled={!isTrackingEnabled}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-forest-500 disabled:bg-gray-100 disabled:text-gray-400"
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
                      <span className="text-sm text-gray-600">
                        Visited: <span className="font-semibold text-green-600">{visitedControls.size}</span>
                      </span>
                      <button
                        onClick={handleReset}
                        disabled={visitedControls.size === 0}
                        className="px-4 py-2 text-sm font-medium text-white bg-forest-600 rounded hover:bg-forest-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
