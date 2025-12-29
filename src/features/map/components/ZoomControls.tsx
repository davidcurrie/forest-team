import { useEffect, useState } from 'react'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
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
    <Stack spacing={1}>
      <IconButton
        onClick={handleZoomIn}
        disabled={!canZoomIn}
        aria-label="Zoom in"
        sx={{
          width: 44,
          height: 44,
          bgcolor: 'background.paper',
          boxShadow: 3,
          '&:hover': {
            bgcolor: 'grey.100',
          },
          '&:active': {
            bgcolor: 'grey.200',
          },
          '&.Mui-disabled': {
            bgcolor: 'background.paper',
            opacity: 0.5,
          },
        }}
      >
        <AddIcon />
      </IconButton>
      <IconButton
        onClick={handleZoomOut}
        disabled={!canZoomOut}
        aria-label="Zoom out"
        sx={{
          width: 44,
          height: 44,
          bgcolor: 'background.paper',
          boxShadow: 3,
          '&:hover': {
            bgcolor: 'grey.100',
          },
          '&:active': {
            bgcolor: 'grey.200',
          },
          '&.Mui-disabled': {
            bgcolor: 'background.paper',
            opacity: 0.5,
          },
        }}
      >
        <RemoveIcon />
      </IconButton>
    </Stack>
  )
}
