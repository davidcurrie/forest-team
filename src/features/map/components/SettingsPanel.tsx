import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import CloseIcon from '@mui/icons-material/Close'
import SettingsIcon from '@mui/icons-material/Settings'
import { Button } from '../../../shared/components/Button'
import { useVisitTrackingStore } from '../../../store/visitTrackingStore'

interface SettingsPanelProps {
  isGPSTracking: boolean
  onToggleGPS: () => void
  gpsError: string | null
}

/**
 * Settings panel containing GPS and visit tracking controls
 * Accessible via a settings button to reduce UI clutter on mobile
 */
export function SettingsPanel({
  isGPSTracking,
  onToggleGPS,
  gpsError,
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Visit tracking state
  const {
    visitDistanceThreshold,
    visitedControls,
    setVisitDistanceThreshold,
    setTrackingEnabled,
    resetVisitedControls,
  } = useVisitTrackingStore()

  // Automatically enable/disable visit tracking when GPS changes
  useEffect(() => {
    setTrackingEnabled(isGPSTracking)
  }, [isGPSTracking, setTrackingEnabled])

  const handleReset = () => {
    if (visitedControls.size === 0) return

    if (confirm(`Reset ${visitedControls.size} visited control${visitedControls.size !== 1 ? 's' : ''}?`)) {
      resetVisitedControls()
    }
  }

  const distanceOptions = [5, 10, 15, 20, 25, 30]

  return (
    <>
      {/* Settings Button */}
      <Button
        variant="primary"
        onClick={() => setIsOpen(!isOpen)}
        startIcon={<SettingsIcon />}
        aria-label="Open settings"
      >
        Settings
      </Button>

      {/* Settings Drawer */}
      <Drawer
        anchor="left"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: 384,
          },
        }}
      >
        {/* Header */}
        <AppBar position="static" color="primary">
          <Toolbar>
            <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
              Settings
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setIsOpen(false)}
              aria-label="Close settings"
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Box sx={{ p: 2, overflow: 'auto' }}>
          {/* GPS & Visit Tracking Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
              GPS & Visit Tracking
            </Typography>
            <Box
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
              }}
            >
              {gpsError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {gpsError}
                </Alert>
              )}

              {/* GPS Toggle */}
              <Box sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1.5 }}>
                  GPS Tracking
                </Typography>
                <Button
                  onClick={onToggleGPS}
                  fullWidth
                  sx={{
                    height: 48,
                    bgcolor: isGPSTracking ? 'primary.main' : 'grey.400',
                    color: 'white',
                    '&:hover': {
                      bgcolor: isGPSTracking ? 'primary.dark' : 'grey.500',
                    },
                  }}
                  aria-label="Toggle GPS tracking"
                >
                  {isGPSTracking ? 'GPS ON' : 'GPS OFF'}
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {isGPSTracking
                    ? 'Location tracking and visit detection active'
                    : 'Enable to track location and mark visited controls'}
                </Typography>
              </Box>

              {/* Distance Threshold */}
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel id="visit-distance-label">Visit distance threshold</InputLabel>
                <Select
                  labelId="visit-distance-label"
                  id="visit-distance"
                  value={visitDistanceThreshold}
                  label="Visit distance threshold"
                  onChange={(e) => setVisitDistanceThreshold(Number(e.target.value))}
                  disabled={!isGPSTracking}
                >
                  {distanceOptions.map((distance) => (
                    <MenuItem key={distance} value={distance}>
                      {distance}m
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Visited Count & Reset */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  Visited:{' '}
                  <Box component="span" fontWeight="semibold" color="primary.main">
                    {visitedControls.size}
                  </Box>
                </Typography>
                <Button
                  onClick={handleReset}
                  disabled={visitedControls.size === 0 || !isGPSTracking}
                  size="md"
                  variant="primary"
                >
                  Reset
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </>
  )
}
