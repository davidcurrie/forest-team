import { Position } from '../../../shared/types'

export interface GPSPosition {
  position: Position
  accuracy: number // meters
  heading: number | null // degrees (0-360, null if not available)
  speed: number | null // meters/second
  timestamp: Date
}

export interface GPSError {
  code: number
  message: string
}

export type GPSCallback = (position: GPSPosition) => void
export type GPSErrorCallback = (error: GPSError) => void

/**
 * GPS tracking service using the Geolocation API
 * Manages location updates with high accuracy mode
 */
export class GPSTracker {
  private watchId: number | null = null
  private callbacks: Set<GPSCallback> = new Set()
  private errorCallbacks: Set<GPSErrorCallback> = new Set()
  private lastPosition: GPSPosition | null = null

  /**
   * Start tracking GPS location
   * @param options Geolocation options
   */
  start(options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000
  }): void {
    if (this.watchId !== null) {
      console.warn('GPS tracking already started')
      return
    }

    if (!navigator.geolocation) {
      this.notifyError({
        code: -1,
        message: 'Geolocation is not supported by this browser'
      })
      return
    }

    this.watchId = navigator.geolocation.watchPosition(
      this.handleSuccess.bind(this),
      this.handleError.bind(this),
      options
    )

    console.log('GPS tracking started with watch ID:', this.watchId)
  }

  /**
   * Stop tracking GPS location
   */
  stop(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      console.log('GPS tracking stopped')
      this.watchId = null
      this.lastPosition = null
    }
  }

  /**
   * Get the last known position
   */
  getLastPosition(): GPSPosition | null {
    return this.lastPosition
  }

  /**
   * Check if GPS tracking is active
   */
  isTracking(): boolean {
    return this.watchId !== null
  }

  /**
   * Subscribe to GPS position updates
   */
  subscribe(callback: GPSCallback): () => void {
    this.callbacks.add(callback)

    // If we have a last position, immediately call the callback
    if (this.lastPosition) {
      callback(this.lastPosition)
    }

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback)
    }
  }

  /**
   * Subscribe to GPS errors
   */
  subscribeToErrors(callback: GPSErrorCallback): () => void {
    this.errorCallbacks.add(callback)

    // Return unsubscribe function
    return () => {
      this.errorCallbacks.delete(callback)
    }
  }

  /**
   * Handle successful position update
   */
  private handleSuccess(position: GeolocationPosition): void {
    const gpsPosition: GPSPosition = {
      position: {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      },
      accuracy: position.coords.accuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: new Date(position.timestamp)
    }

    this.lastPosition = gpsPosition
    this.notifyCallbacks(gpsPosition)

    console.log('GPS position updated:', {
      lat: gpsPosition.position.lat,
      lng: gpsPosition.position.lng,
      accuracy: `${gpsPosition.accuracy.toFixed(1)}m`,
      heading: gpsPosition.heading !== null ? `${gpsPosition.heading.toFixed(0)}°` : 'N/A'
    })
  }

  /**
   * Handle GPS error
   */
  private handleError(error: GeolocationPositionError): void {
    const gpsError: GPSError = {
      code: error.code,
      message: this.getErrorMessage(error.code)
    }

    this.notifyError(gpsError)
    console.error('GPS error:', gpsError.message)
  }

  /**
   * Notify all subscribed callbacks
   */
  private notifyCallbacks(position: GPSPosition): void {
    this.callbacks.forEach(callback => {
      try {
        callback(position)
      } catch (error) {
        console.error('Error in GPS callback:', error)
      }
    })
  }

  /**
   * Notify all error callbacks
   */
  private notifyError(error: GPSError): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error)
      } catch (err) {
        console.error('Error in GPS error callback:', err)
      }
    })
  }

  /**
   * Get human-readable error message
   */
  private getErrorMessage(code: number): string {
    switch (code) {
      case 1: // PERMISSION_DENIED
        return 'Location permission denied. Please enable location access in your browser settings.'
      case 2: // POSITION_UNAVAILABLE
        return 'Location unavailable. Please check your device settings and try again.'
      case 3: // TIMEOUT
        return 'Location request timed out. Please try again.'
      default:
        return 'An unknown error occurred while getting your location.'
    }
  }
}

// Singleton instance
export const gpsTracker = new GPSTracker()
