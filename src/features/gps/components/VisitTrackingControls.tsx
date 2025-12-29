import { useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Switch from '@mui/material/Switch'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Collapse from '@mui/material/Collapse'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { Button } from '../../../shared/components/Button'
import { useVisitTrackingStore } from '../../../store/visitTrackingStore'

interface VisitTrackingControlsProps {
  isGPSTracking: boolean
}

/**
 * Controls for visit tracking feature
 * Allows user to configure visit distance threshold and reset visited controls
 */
export function VisitTrackingControls({ isGPSTracking }: VisitTrackingControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const {
    visitDistanceThreshold,
    isTrackingEnabled,
    visitedControls,
    setVisitDistanceThreshold,
    setTrackingEnabled,
    resetVisitedControls,
  } = useVisitTrackingStore()

  // Don't show if GPS is not active
  if (!isGPSTracking) {
    return null
  }

  const handleReset = () => {
    if (visitedControls.size === 0) {
      return
    }

    if (confirm(`Reset ${visitedControls.size} visited control${visitedControls.size !== 1 ? 's' : ''}?`)) {
      resetVisitedControls()
    }
  }

  const distanceOptions = [5, 10, 15, 20, 25, 30]

  return (
    <Card sx={{ minWidth: 220, pointerEvents: 'auto' }}>
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="subtitle2" fontWeight="semibold">
          Visit Tracking
        </Typography>
        <IconButton
          size="small"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Content - collapsible */}
      <Collapse in={isExpanded}>
        <CardContent sx={{ p: 1.5 }}>
          {/* Enable/Disable Status with prominent indicator */}
          <Box
            sx={{
              mb: 1.5,
              p: 1,
              borderRadius: 1,
              bgcolor: isTrackingEnabled ? 'success.light' : 'grey.100',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: isTrackingEnabled ? 'success.main' : 'grey.400',
                  }}
                />
                <Typography
                  variant="body2"
                  fontWeight="medium"
                  color={isTrackingEnabled ? 'success.dark' : 'text.secondary'}
                >
                  {isTrackingEnabled ? 'Tracking Active' : 'Tracking Paused'}
                </Typography>
              </Box>
              <Switch
                checked={isTrackingEnabled}
                onChange={(e) => setTrackingEnabled(e.target.checked)}
                size="small"
                aria-label="Toggle visit tracking"
              />
            </Box>
            {!isTrackingEnabled && (
              <Typography variant="caption" color="text.secondary">
                Enable to mark controls as visited
              </Typography>
            )}
          </Box>

          {/* Distance Threshold Selector */}
          <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
            <InputLabel id="visit-distance-label">Visit distance</InputLabel>
            <Select
              labelId="visit-distance-label"
              id="visit-distance"
              value={visitDistanceThreshold}
              label="Visit distance"
              onChange={(e) => setVisitDistanceThreshold(Number(e.target.value))}
              disabled={!isTrackingEnabled}
            >
              {distanceOptions.map((distance) => (
                <MenuItem key={distance} value={distance}>
                  {distance}m
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Visited Count & Reset */}
          <Box sx={{ pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Visited:{' '}
                <Box component="span" fontWeight="semibold" color="success.main">
                  {visitedControls.size}
                </Box>
              </Typography>
              <Button
                onClick={handleReset}
                disabled={visitedControls.size === 0}
                size="sm"
                variant="primary"
              >
                Reset
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  )
}
