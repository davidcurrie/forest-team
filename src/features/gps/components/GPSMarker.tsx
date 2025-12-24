import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { GPSPosition } from '../services/gpsTracker'

interface GPSMarkerProps {
  map: L.Map | null
  position: GPSPosition | null
  autoCentering?: boolean
}

/**
 * Display user's GPS location on the map
 * Shows position marker and accuracy circle
 */
export function GPSMarker({ map, position, autoCentering = false }: GPSMarkerProps) {
  const markerRef = useRef<L.CircleMarker | null>(null)
  const accuracyCircleRef = useRef<L.Circle | null>(null)
  const hasAutocenteredRef = useRef(false)

  useEffect(() => {
    if (!map || !position) {
      // Clean up markers if position is lost
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove()
        accuracyCircleRef.current = null
      }
      hasAutocenteredRef.current = false
      return
    }

    const coords: L.LatLngExpression = [position.position.lat, position.position.lng]

    // Create or update accuracy circle
    if (!accuracyCircleRef.current) {
      accuracyCircleRef.current = L.circle(coords, {
        radius: position.accuracy,
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        color: '#3b82f6',
        weight: 1,
        opacity: 0.4
      })
      accuracyCircleRef.current.addTo(map)
    } else {
      accuracyCircleRef.current.setLatLng(coords)
      accuracyCircleRef.current.setRadius(position.accuracy)
    }

    // Create or update position marker
    if (!markerRef.current) {
      markerRef.current = L.circleMarker(coords, {
        radius: 8,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        color: '#ffffff',
        weight: 3,
        opacity: 1
      })
      markerRef.current.addTo(map)

      // Add popup with position info
      markerRef.current.bindPopup(`
        <div style="font-family: Arial, sans-serif; min-width: 140px;">
          <div style="font-weight: bold; margin-bottom: 4px;">Your Location</div>
          <div style="font-size: 12px; color: #666;">
            Accuracy: ±${position.accuracy.toFixed(1)}m
          </div>
          ${position.heading !== null ? `
            <div style="font-size: 12px; color: #666;">
              Heading: ${position.heading.toFixed(0)}°
            </div>
          ` : ''}
        </div>
      `, {
        closeButton: true,
        minWidth: 140
      })
    } else {
      markerRef.current.setLatLng(coords)

      // Update popup content
      markerRef.current.setPopupContent(`
        <div style="font-family: Arial, sans-serif; min-width: 140px;">
          <div style="font-weight: bold; margin-bottom: 4px;">Your Location</div>
          <div style="font-size: 12px; color: #666;">
            Accuracy: ±${position.accuracy.toFixed(1)}m
          </div>
          ${position.heading !== null ? `
            <div style="font-size: 12px; color: #666;">
              Heading: ${position.heading.toFixed(0)}°
            </div>
          ` : ''}
        </div>
      `)
    }

    // Auto-center on first position or if autoCentering is enabled
    if (autoCentering || !hasAutocenteredRef.current) {
      map.setView(coords, map.getZoom(), { animate: true })
      hasAutocenteredRef.current = true
    }

    // Cleanup on unmount
    return () => {
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove()
        accuracyCircleRef.current = null
      }
    }
  }, [map, position, autoCentering])

  return null // This component doesn't render anything itself
}
