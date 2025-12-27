import { useEffect } from 'react'
import type { Course } from '../../../shared/types'
import type { GPSPosition } from '../services/gpsTracker'
import { useVisitTrackingStore } from '../../../store/visitTrackingStore'
import { isWithinDistance } from '../../../shared/utils/coordinate'

/**
 * Hook that tracks control visits based on GPS position
 * Automatically marks controls as visited when GPS position is within threshold
 */
export function useControlVisitTracking(
  gpsPosition: GPSPosition | null,
  courses: Course[],
  visibleCourseIds: Set<string>
) {
  const {
    visitDistanceThreshold,
    markControlAsVisited,
    isTrackingEnabled,
    isControlVisited
  } = useVisitTrackingStore()

  useEffect(() => {
    // Only track if GPS is active and tracking is enabled
    if (!gpsPosition || !isTrackingEnabled) {
      return
    }

    // Get all controls from visible courses
    const visibleControls = courses
      .filter((course) => visibleCourseIds.has(course.id))
      .flatMap((course) => course.controls)

    // Check each control to see if we're within visit distance
    // IMPORTANT: Only mark if not already visited to prevent infinite loops
    visibleControls.forEach((control) => {
      // Skip if already visited
      if (isControlVisited(control.id)) {
        return
      }

      if (
        isWithinDistance(
          gpsPosition.position,
          control.position,
          visitDistanceThreshold
        )
      ) {
        markControlAsVisited(control.id)
      }
    })
  }, [
    gpsPosition,
    courses,
    visibleCourseIds,
    visitDistanceThreshold,
    markControlAsVisited,
    isTrackingEnabled,
    isControlVisited,
  ])
}
