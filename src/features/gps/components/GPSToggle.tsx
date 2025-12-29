interface GPSToggleProps {
  isTracking: boolean
  onToggle: () => void
  accuracy: number | null
  error: string | null
}

/**
 * GPS toggle button with status indicator
 * Shows GPS state (on/off/loading/error)
 */
export function GPSToggle({ isTracking, onToggle, accuracy, error }: GPSToggleProps) {
  // Determine button state
  const hasError = error !== null
  const hasWarning = accuracy !== null && accuracy > 50

  // Button styling based on state
  const getButtonClass = () => {
    const baseClass = 'w-touch h-touch bg-white shadow-lg rounded-lg flex items-center justify-center transition-colors'

    if (hasError) {
      return `${baseClass} border-2 border-red-500`
    }

    if (isTracking) {
      if (hasWarning) {
        return `${baseClass} border-2 border-yellow-500`
      }
      return `${baseClass} border-2 border-blue-500`
    }

    return `${baseClass} hover:bg-gray-100 active:bg-gray-200`
  }

  // Icon color based on state
  const getIconColor = () => {
    if (hasError) return 'rgb(239 68 68)' // red-500
    if (isTracking) {
      if (hasWarning) return 'rgb(234 179 8)' // yellow-500
      return 'rgb(59 130 246)' // blue-500
    }
    return 'rgb(107 114 128)' // gray-500
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onToggle}
        className={`${getButtonClass()} focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          hasError ? 'focus:ring-red-500' : isTracking ? 'focus:ring-blue-500' : 'focus:ring-gray-400'
        }`}
        aria-label={isTracking ? 'Turn off GPS' : 'Turn on GPS'}
        title={error || (hasWarning ? `Low accuracy: ±${accuracy?.toFixed(0)}m` : 'GPS tracking')}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={getIconColor()}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isTracking ? (
            // GPS active icon
            <>
              <circle cx="12" cy="12" r="3" fill={getIconColor()} />
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
            </>
          ) : (
            // GPS inactive icon
            <>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </>
          )}
        </svg>
      </button>

      {/* Accuracy indicator text (optional, shows below button) */}
      {isTracking && accuracy !== null && !hasError && (
        <div className="text-[10px] text-center px-2 py-1 bg-white rounded shadow min-w-touch">
          ±{accuracy < 10 ? accuracy.toFixed(1) : accuracy.toFixed(0)}m
        </div>
      )}
    </div>
  )
}
