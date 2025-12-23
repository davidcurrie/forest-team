import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { Course } from '../../../shared/types'
import { createCourseLayer } from '../services/courseRenderer'

interface CourseLayerProps {
  map: L.Map | null
  courses: Course[]
}

export function CourseLayer({ map, courses }: CourseLayerProps) {
  const layersRef = useRef<Map<string, L.LayerGroup>>(new Map())

  useEffect(() => {
    if (!map) return

    // Validate map has a container
    try {
      const container = map.getContainer()
      if (!container) {
        console.warn('Map container not found, skipping course rendering')
        return
      }
    } catch (e) {
      console.warn('Error accessing map container:', e)
      return
    }

    const currentLayers = layersRef.current

    // Small delay to ensure map is fully initialized
    const timeoutId = setTimeout(() => {
      try {
        // Remove layers for courses that are no longer visible
        currentLayers.forEach((layer, courseId) => {
          const course = courses.find(c => c.id === courseId)
          if (!course || !course.visible) {
            layer.remove()
            currentLayers.delete(courseId)
          }
        })

        // Add layers for visible courses that aren't rendered yet
        courses.forEach(course => {
          if (course.visible && !currentLayers.has(course.id)) {
            const layer = createCourseLayer(course)
            layer.addTo(map)
            currentLayers.set(course.id, layer)
          }
        })
      } catch (e) {
        console.error('Error rendering courses:', e)
      }
    }, 100) // 100ms delay to ensure map is ready

    // Cleanup on unmount
    return () => {
      clearTimeout(timeoutId)
      currentLayers.forEach(layer => {
        try {
          layer.remove()
        } catch (e) {
          // Ignore errors during cleanup
        }
      })
      currentLayers.clear()
    }
  }, [map, courses])

  return null // This component doesn't render anything itself
}
