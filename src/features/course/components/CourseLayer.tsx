import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { Course } from '../../../shared/types'
import { renderCourse } from '../services/courseRenderer'

interface CourseLayerProps {
  map: L.Map | null
  courses: Course[]
}

export function CourseLayer({ map, courses }: CourseLayerProps) {
  const layersRef = useRef<Map<string, L.LayerGroup>>(new Map())

  useEffect(() => {
    if (!map) return

    const currentLayers = layersRef.current

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
        const layer = renderCourse(map, course)
        currentLayers.set(course.id, layer)
      }
    })

    // Cleanup on unmount
    return () => {
      currentLayers.forEach(layer => layer.remove())
      currentLayers.clear()
    }
  }, [map, courses])

  return null // This component doesn't render anything itself
}
