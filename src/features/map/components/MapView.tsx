import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LatLngBounds, GeoReference } from '../../../shared/types'

interface MapViewProps {
  imageUrl: string
  bounds: LatLngBounds
  georef: GeoReference
  onMapReady?: (map: L.Map) => void
}

export function MapView({ imageUrl, bounds, georef, onMapReady }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const imageOverlay = useRef<L.ImageOverlay | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    console.log('MapView - Georef type:', georef.type)
    console.log('MapView - Bounds:', bounds)
    console.log('MapView - Image URL:', imageUrl.substring(0, 50))

    // Determine CRS based on georef type
    // KMZ files use geographic coordinates (WGS84 lat/lng)
    // Use EPSG3857 (Web Mercator) which is the standard for web maps
    // World files use projected/arbitrary coordinates
    const crs = georef.type === 'kmz' ? L.CRS.EPSG3857 : L.CRS.Simple
    console.log('MapView - Using CRS:', georef.type === 'kmz' ? 'EPSG3857' : 'Simple')

    // Zoom levels depend on CRS
    // For geographic CRS (EPSG3857), use web map zoom levels (10-22)
    // For Simple CRS, use arbitrary zoom levels (-2 to 4)
    const minZoom = georef.type === 'kmz' ? 10 : -2
    const maxZoom = georef.type === 'kmz' ? 22 : 4

    // Initialize map
    const map = L.map(mapContainer.current, {
      crs,
      zoomControl: false, // We'll add custom zoom controls later
      attributionControl: false,
      minZoom,
      maxZoom,
      // Touch-optimized settings
      touchZoom: true,
      doubleClickZoom: true,
      scrollWheelZoom: true,
      boxZoom: false,
      keyboard: true,
      dragging: true,
      zoomSnap: 0.25, // Smoother zoom transitions
      zoomDelta: 0.5,
      wheelDebounceTime: 40,
      wheelPxPerZoomLevel: 120,
    })

    mapInstance.current = map

    // Create Leaflet bounds from our LatLngBounds
    const leafletBounds = L.latLngBounds(
      [bounds.south, bounds.west],
      [bounds.north, bounds.east]
    )

    // Add image overlay
    const overlay = L.imageOverlay(imageUrl, leafletBounds, {
      opacity: 1,
      interactive: false,
    })
    overlay.addTo(map)
    imageOverlay.current = overlay

    // Fit map to image bounds
    map.fitBounds(leafletBounds)

    // Handle resize on orientation change
    const handleResize = () => {
      map.invalidateSize()
    }
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    // Notify parent component
    if (onMapReady) {
      onMapReady(map)
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      if (imageOverlay.current) {
        imageOverlay.current.remove()
      }
      if (mapInstance.current) {
        mapInstance.current.remove()
      }
    }
  }, [imageUrl, bounds, georef, onMapReady])

  return (
    <div
      ref={mapContainer}
      className="w-full h-full"
      style={{ touchAction: 'none' }} // Prevent default touch behaviors
    />
  )
}
