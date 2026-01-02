import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import L from 'leaflet'
import { Event, Course } from '../../../shared/types'
import { db } from '../../../db/schema'
import { MapView } from './MapView'
import { ZoomControls } from './ZoomControls'
import { SettingsPanel } from './SettingsPanel'
import { Loading } from '../../../shared/components/Loading'
import { Button } from '../../../shared/components/Button'
import { CourseLayer } from '../../course/components/CourseLayer'
import { ControlsLayer } from '../../course/components/ControlsLayer'
import { useGPSTracking } from '../../gps/hooks/useGPSTracking'
import { useControlVisitTracking } from '../../gps/hooks/useControlVisitTracking'
import { GPSMarker } from '../../gps/components/GPSMarker'

export function MapPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [map, setMap] = useState<L.Map | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [useProjectedCoords, setUseProjectedCoords] = useState(false)
  const [selectedTab, setSelectedTab] = useState<string>('all') // 'all' or courseId

  // GPS tracking
  const { isTracking, position, error: gpsError, toggleTracking } = useGPSTracking()

  // Control visit tracking - track which controls have been visited
  const visibleCourseIds = new Set(
    selectedTab === 'all'
      ? courses.map(c => c.id)
      : [selectedTab]
  )
  useControlVisitTracking(position, courses, visibleCourseIds)

  // Update courses visibility based on selected tab
  const visibleCourses = courses.map(course => ({
    ...course,
    visible: selectedTab === 'all' || course.id === selectedTab
  }))

  // For "All Controls" tab, show all controls but no course lines
  // For individual course tabs, show only that course's controls and lines
  const coursesForControls = selectedTab === 'all' ? courses : courses.filter(c => c.id === selectedTab)

  // For start/finish markers and course lines:
  // - "All Controls" tab: show all starts/finishes, no course lines
  // - Individual course tabs: show selected course's starts/finishes and lines
  const coursesForStartFinish = selectedTab === 'all'
    ? courses.map(c => ({ ...c, visible: true }))
    : visibleCourses.filter(c => c.visible)

  useEffect(() => {
    async function loadEvent() {
      if (!eventId) {
        setError('No event ID provided')
        setLoading(false)
        return
      }

      try {
        const loadedEvent = await db.events.get(eventId)

        if (!loadedEvent) {
          setError('Event not found')
          setLoading(false)
          return
        }

        setEvent(loadedEvent)
        setCourses(loadedEvent.courses)

        // Determine if using projected coordinates
        const georef = loadedEvent.map.georef
        const bounds = loadedEvent.map.bounds
        const isGeographic =
          georef.type === 'kmz' ||
          (Math.abs(georef.topLeftY) <= 90 &&
            Math.abs(georef.topLeftX) <= 180 &&
            Math.abs(bounds.north) <= 90 &&
            Math.abs(bounds.south) <= 90 &&
            Math.abs(bounds.east) <= 180 &&
            Math.abs(bounds.west) <= 180)
        setUseProjectedCoords(!isGeographic)

        // Create object URL from image blob
        const url = URL.createObjectURL(loadedEvent.map.imageBlob)
        setImageUrl(url)

        setLoading(false)
      } catch (err) {
        console.error('Failed to load event:', err)
        setError('Failed to load event')
        setLoading(false)
      }
    }

    loadEvent()

    // Cleanup: revoke object URL when component unmounts
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [eventId])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Loading />
      </Box>
    )
  }

  if (error || !event) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 2,
          p: 2,
        }}
      >
        <Typography variant="body1" color="error">
          {error || 'Event not found'}
        </Typography>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <AppBar position="static">
        <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="h1"
            fontWeight="semibold"
            noWrap
            sx={{ flex: 1, textAlign: 'center', px: 2 }}
          >
            {event.name}
          </Typography>
          <Box sx={{ width: 48 }} /> {/* Spacer for centering */}
        </Toolbar>
        {/* Course Tabs */}
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            bgcolor: 'primary.dark',
            minHeight: 48,
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              minHeight: 48,
            },
            '& .Mui-selected': {
              color: 'white',
            },
          }}
        >
          <Tab label="All Controls" value="all" />
          {courses.map(course => (
            <Tab key={course.id} label={course.name} value={course.id} />
          ))}
        </Tabs>
      </AppBar>

      {/* Map */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <MapView
          imageUrl={imageUrl}
          bounds={event.map.bounds}
          georef={event.map.georef}
          onMapReady={setMap}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          <Box sx={{ position: 'absolute', left: 16, top: 16, pointerEvents: 'auto' }}>
            <SettingsPanel
              isGPSTracking={isTracking}
              onToggleGPS={toggleTracking}
              gpsError={gpsError?.message ?? null}
            />
          </Box>
          <Box sx={{ position: 'absolute', right: 16, top: 16, pointerEvents: 'auto' }}>
            <ZoomControls map={map} />
          </Box>
        </Box>
        <ControlsLayer map={map} courses={coursesForControls} useProjectedCoords={useProjectedCoords} />
        <CourseLayer map={map} courses={coursesForStartFinish} useProjectedCoords={useProjectedCoords} showPolylines={selectedTab !== 'all'} />
        <GPSMarker map={map} position={position} />
      </Box>
    </Box>
  )
}
