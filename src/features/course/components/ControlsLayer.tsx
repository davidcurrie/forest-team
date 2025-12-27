import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { Course, Position } from '../../../shared/types'
import { extractUniqueControls, createControlsLayer, calculateLineWidth } from '../services/courseRenderer'
import { useVisitTrackingStore } from '../../../store/visitTrackingStore'

interface ControlsLayerProps {
  map: L.Map | null
  courses: Course[]
  useProjectedCoords: boolean
}

/**
 * Renders all unique controls as an always-visible layer
 * Each control shows the control code and displays all courses that visit it
 */
export function ControlsLayer({ map, courses, useProjectedCoords }: ControlsLayerProps) {
  const layerRef = useRef<L.LayerGroup | null>(null)
  const [zoom, setZoom] = useState<number>(15)

  // Get visited controls from store - component will re-render when this changes
  const visitedControls = useVisitTrackingStore(state => state.visitedControls)
  const isControlVisited = useVisitTrackingStore(state => state.isControlVisited)

  // Listen for zoom changes
  useEffect(() => {
    if (!map) return

    const handleZoomEnd = () => {
      const newZoom = map.getZoom()
      setZoom(newZoom)

      // Update circle stroke widths
      const lineWidth = calculateLineWidth(newZoom)
      if (layerRef.current) {
        layerRef.current.eachLayer((layer) => {
          if (layer instanceof L.Circle) {
            layer.setStyle({ weight: lineWidth })
          }
        })
      }
    }

    // Set initial zoom
    setZoom(map.getZoom())

    map.on('zoomend', handleZoomEnd)

    return () => {
      map.off('zoomend', handleZoomEnd)
    }
  }, [map])

  useEffect(() => {
    if (!map || courses.length === 0) return

    console.log('ControlsLayer effect running with', courses.length, 'courses', 'useProjectedCoords:', useProjectedCoords, 'zoom:', zoom)

    // For projected coordinates, we cannot render controls without knowing the projection
    if (useProjectedCoords) {
      console.warn(
        'Control rendering is not supported for world files with projected coordinates. ' +
        'The world file appears to use a projected coordinate system (like UTM or local grid), ' +
        'but without a .prj file, we cannot determine which projection to use. ' +
        'To display controls:\n' +
        '  1. Use a KMZ file instead (geographic coordinates)\n' +
        '  2. Or use a world file with geographic coordinates (lat/lng in .jgw file)'
      )
      return
    }

    // Create coordinate transform function (only for geographic coordinates)
    const transform = (pos: Position): [number, number] => {
      return [pos.lat, pos.lng]
    }

    // Validate map has a container
    try {
      const container = map.getContainer()
      if (!container) {
        console.warn('Map container not found, skipping control rendering')
        return
      }
    } catch (e) {
      console.warn('Error accessing map container:', e)
      return
    }

    // Small delay to ensure map is fully initialized
    const timeoutId = setTimeout(() => {
      console.log('ControlsLayer timeout callback executing...')

      try {
        // Remove existing layer if present
        if (layerRef.current) {
          console.log('Removing existing controls layer')
          layerRef.current.remove()
          layerRef.current = null
        }

        // Extract unique controls from all courses
        const uniqueControls = extractUniqueControls(courses)
        console.log('Extracted', uniqueControls.length, 'unique controls')

        // Create and add controls layer with visit tracking
        const checkVisited = (controlIds: string[]) => {
          return controlIds.some(id => isControlVisited(id))
        }
        const layer = createControlsLayer(uniqueControls, transform, zoom, checkVisited)
        console.log('Adding controls layer to map...')
        layer.addTo(map)
        layerRef.current = layer
        console.log('Controls layer added successfully')
      } catch (e) {
        console.error('Error rendering controls:', e)
      }
    }, 100) // 100ms delay to ensure map is ready

    // Cleanup on unmount or when courses change
    return () => {
      clearTimeout(timeoutId)
      if (layerRef.current) {
        try {
          layerRef.current.remove()
        } catch (e) {
          // Ignore errors during cleanup
        }
        layerRef.current = null
      }
    }
  }, [map, courses, useProjectedCoords, zoom, visitedControls, isControlVisited])

  return null // This component doesn't render anything itself
}
