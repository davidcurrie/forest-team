interface AccuracyWarningProps {
  accuracy: number | null
  isTracking: boolean
}

/**
 * Display a warning when GPS accuracy is poor (>50m)
 * Non-blocking warning that appears at the top of the map
 */
export function AccuracyWarning({ accuracy, isTracking }: AccuracyWarningProps) {
  if (!isTracking || accuracy === null || accuracy <= 50) {
    return null
  }

  const getSeverityColor = () => {
    if (accuracy > 100) return 'bg-red-100 border-red-400 text-red-800'
    if (accuracy > 50) return 'bg-yellow-100 border-yellow-400 text-yellow-800'
    return 'bg-blue-100 border-blue-400 text-blue-800'
  }

  const getSeverityText = () => {
    if (accuracy > 100) return 'Very Low Accuracy'
    if (accuracy > 50) return 'Low Accuracy'
    return 'Moderate Accuracy'
  }

  return (
    <div
      className={`${getSeverityColor()} border-l-4 px-4 py-3 rounded shadow-lg max-w-sm absolute top-4 left-1/2 -translate-x-1/2 z-[1000]`}
      style={{ pointerEvents: 'auto' }}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center gap-2">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="font-semibold text-sm">{getSeverityText()}</p>
          <p className="text-xs">GPS accuracy: ±{accuracy.toFixed(0)}m</p>
        </div>
      </div>
    </div>
  )
}
