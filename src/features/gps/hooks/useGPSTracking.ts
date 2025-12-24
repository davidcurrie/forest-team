import { useState, useEffect, useCallback } from 'react'
import { gpsTracker, GPSPosition, GPSError } from '../services/gpsTracker'

export interface UseGPSTrackingResult {
  isTracking: boolean
  position: GPSPosition | null
  error: GPSError | null
  accuracy: number | null
  startTracking: () => void
  stopTracking: () => void
  toggleTracking: () => void
}

/**
 * Custom hook for GPS tracking
 * Manages GPS state and provides controls for starting/stopping tracking
 */
export function useGPSTracking(): UseGPSTrackingResult {
  const [isTracking, setIsTracking] = useState(false)
  const [position, setPosition] = useState<GPSPosition | null>(null)
  const [error, setError] = useState<GPSError | null>(null)

  const startTracking = useCallback(() => {
    setError(null)
    gpsTracker.start()
    setIsTracking(true)
  }, [])

  const stopTracking = useCallback(() => {
    gpsTracker.stop()
    setIsTracking(false)
    setPosition(null)
    setError(null)
  }, [])

  const toggleTracking = useCallback(() => {
    if (isTracking) {
      stopTracking()
    } else {
      startTracking()
    }
  }, [isTracking, startTracking, stopTracking])

  useEffect(() => {
    // Subscribe to position updates
    const unsubscribePosition = gpsTracker.subscribe((newPosition) => {
      setPosition(newPosition)
      setError(null) // Clear any previous errors on successful update
    })

    // Subscribe to errors
    const unsubscribeErrors = gpsTracker.subscribeToErrors((newError) => {
      setError(newError)
    })

    // Cleanup on unmount
    return () => {
      unsubscribePosition()
      unsubscribeErrors()
    }
  }, [])

  return {
    isTracking,
    position,
    error,
    accuracy: position?.accuracy ?? null,
    startTracking,
    stopTracking,
    toggleTracking
  }
}
