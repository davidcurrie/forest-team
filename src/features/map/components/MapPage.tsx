import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { Event, Course } from '../../../shared/types'
import { db } from '../../../db/schema'
import { MapView } from './MapView'
import { ZoomControls } from './ZoomControls'
import { SettingsPanel } from './SettingsPanel'
import { Loading } from '../../../shared/components/Loading'
import { CourseLayer } from '../../course/components/CourseLayer'
import { ControlsLayer } from '../../course/components/ControlsLayer'
import { useGPSTracking } from '../../gps/hooks/useGPSTracking'
import { useControlVisitTracking } from '../../gps/hooks/useControlVisitTracking'
import { GPSMarker } from '../../gps/components/GPSMarker'
import { GPSToggle } from '../../gps/components/GPSToggle'
import { AccuracyWarning } from '../../gps/components/AccuracyWarning'

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

  // GPS tracking
  const { isTracking, position, error: gpsError, accuracy, toggleTracking } = useGPSTracking()

  // Control visit tracking - track which controls have been visited
  const visibleCourseIds = new Set(courses.filter(c => c.visible).map(c => c.id))
  useControlVisitTracking(position, courses, visibleCourseIds)

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

  const handleToggleCourse = (courseId: string) => {
    setCourses(prevCourses =>
      prevCourses.map(course =>
        course.id === courseId ? { ...course, visible: !course.visible } : course
      )
    )
  }

  const handleToggleAll = (visible: boolean) => {
    setCourses(prevCourses => prevCourses.map(course => ({ ...course, visible })))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 p-4">
        <p className="text-outdoor-base text-red-600">{error || 'Event not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-forest-600 text-white rounded hover:bg-forest-700"
        >
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-forest-700 text-white p-3 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="px-3 py-2 hover:bg-forest-600 rounded"
        >
          ← Back
        </button>
        <h1 className="text-outdoor-base font-semibold truncate mx-2">
          {event.name}
        </h1>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapView
          imageUrl={imageUrl}
          bounds={event.map.bounds}
          georef={event.map.georef}
          onMapReady={setMap}
        />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 1000 }}>
          <AccuracyWarning accuracy={accuracy} isTracking={isTracking} />
          <div style={{ position: 'absolute', left: '1rem', top: '1rem', zIndex: 1000, pointerEvents: 'auto' }}>
            <SettingsPanel
              courses={courses}
              onToggleCourse={handleToggleCourse}
              onToggleAll={handleToggleAll}
              isGPSTracking={isTracking}
            />
          </div>
          <div style={{ position: 'absolute', right: '1rem', top: '1rem', zIndex: 1000, pointerEvents: 'auto' }}>
            <GPSToggle
              isTracking={isTracking}
              onToggle={toggleTracking}
              accuracy={accuracy}
              error={gpsError?.message ?? null}
            />
          </div>
          <div style={{ position: 'absolute', right: '1rem', top: '7rem', zIndex: 1000, pointerEvents: 'auto' }}>
            <ZoomControls map={map} />
          </div>
        </div>
        <ControlsLayer map={map} courses={courses} useProjectedCoords={useProjectedCoords} />
        <CourseLayer map={map} courses={courses} useProjectedCoords={useProjectedCoords} />
        <GPSMarker map={map} position={position} />
      </div>
    </div>
  )
}
