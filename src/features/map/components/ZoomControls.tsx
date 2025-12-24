import { useEffect, useState } from 'react'
import L from 'leaflet'

interface ZoomControlsProps {
  map: L.Map | null
}

export function ZoomControls({ map }: ZoomControlsProps) {
  const [canZoomIn, setCanZoomIn] = useState(true)
  const [canZoomOut, setCanZoomOut] = useState(true)

  useEffect(() => {
    if (!map) return

    const updateZoomState = () => {
      const currentZoom = map.getZoom()
      const maxZoom = map.getMaxZoom()
      const minZoom = map.getMinZoom()

      setCanZoomIn(currentZoom < maxZoom)
      setCanZoomOut(currentZoom > minZoom)
    }

    // Initial state
    updateZoomState()

    // Listen to zoom changes
    map.on('zoomend', updateZoomState)

    return () => {
      map.off('zoomend', updateZoomState)
    }
  }, [map])

  const handleZoomIn = () => {
    if (map && canZoomIn) {
      map.zoomIn()
    }
  }

  const handleZoomOut = () => {
    if (map && canZoomOut) {
      map.zoomOut()
    }
  }

  return (
    <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={handleZoomIn}
        disabled={!canZoomIn}
        className="w-touch h-touch bg-white shadow-lg rounded-lg flex items-center justify-center text-2xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 active:bg-gray-200"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        onClick={handleZoomOut}
        disabled={!canZoomOut}
        className="w-touch h-touch bg-white shadow-lg rounded-lg flex items-center justify-center text-2xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 active:bg-gray-200"
        aria-label="Zoom out"
      >
        −
      </button>
    </div>
  )
}
