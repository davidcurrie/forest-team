import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GPSTracker } from './gpsTracker'

describe('GPSTracker', () => {
  let tracker: GPSTracker

  beforeEach(() => {
    tracker = new GPSTracker()
    // Mock geolocation API
    global.navigator = {
      geolocation: {
        watchPosition: vi.fn(),
        clearWatch: vi.fn(),
        getCurrentPosition: vi.fn(),
      },
    } as any
  })

  describe('start', () => {
    it('should call watchPosition when started', () => {
      tracker.start()
      expect(navigator.geolocation.watchPosition).toHaveBeenCalled()
    })

    it('should not start twice', () => {
      tracker.start()
      const firstCallCount = (navigator.geolocation.watchPosition as any).mock.calls.length

      tracker.start()
      const secondCallCount = (navigator.geolocation.watchPosition as any).mock.calls.length

      // Should still only be called once
      expect(secondCallCount).toBe(firstCallCount)
    })

    it('should use high accuracy by default', () => {
      tracker.start()
      const options = (navigator.geolocation.watchPosition as any).mock.calls[0][2]
      expect(options.enableHighAccuracy).toBe(true)
    })
  })

  describe('stop', () => {
    it('should call clearWatch when stopped', () => {
      // Mock watchPosition to return an ID
      vi.mocked(navigator.geolocation.watchPosition).mockReturnValue(123)

      tracker.start()
      tracker.stop()

      expect(navigator.geolocation.clearWatch).toHaveBeenCalledWith(123)
    })

    it('should clear last position when stopped', () => {
      vi.mocked(navigator.geolocation.watchPosition).mockImplementation((success) => {
        // Simulate a position update
        success({
          coords: {
            latitude: 51.5,
            longitude: -0.1,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as GeolocationPosition)
        return 123
      })

      tracker.start()
      expect(tracker.getLastPosition()).toBeTruthy()

      tracker.stop()
      expect(tracker.getLastPosition()).toBeNull()
    })
  })

  describe('isTracking', () => {
    it('should return false initially', () => {
      expect(tracker.isTracking()).toBe(false)
    })

    it('should return true after starting', () => {
      vi.mocked(navigator.geolocation.watchPosition).mockReturnValue(123)
      tracker.start()
      expect(tracker.isTracking()).toBe(true)
    })

    it('should return false after stopping', () => {
      vi.mocked(navigator.geolocation.watchPosition).mockReturnValue(123)
      tracker.start()
      tracker.stop()
      expect(tracker.isTracking()).toBe(false)
    })
  })

  describe('subscribe', () => {
    it('should call callback on position update', () => {
      const callback = vi.fn()

      vi.mocked(navigator.geolocation.watchPosition).mockImplementation((success) => {
        setTimeout(() => {
          success({
            coords: {
              latitude: 51.5,
              longitude: -0.1,
              accuracy: 10,
              altitude: null,
              altitudeAccuracy: null,
              heading: 90,
              speed: 5,
            },
            timestamp: Date.now(),
          } as GeolocationPosition)
        }, 10)
        return 123
      })

      tracker.subscribe(callback)
      tracker.start()

      // Wait for async update
      return new Promise(resolve => {
        setTimeout(() => {
          expect(callback).toHaveBeenCalled()
          const position = callback.mock.calls[0][0]
          expect(position.position.lat).toBe(51.5)
          expect(position.position.lng).toBe(-0.1)
          expect(position.accuracy).toBe(10)
          expect(position.heading).toBe(90)
          resolve(undefined)
        }, 50)
      })
    })

    it('should return unsubscribe function', () => {
      const callback = vi.fn()
      const unsubscribe = tracker.subscribe(callback)

      expect(typeof unsubscribe).toBe('function')
    })
  })
})
