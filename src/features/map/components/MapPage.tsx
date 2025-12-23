import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import L from 'leaflet'
import { Event, Course } from '../../../shared/types'
import { db } from '../../../db/schema'
import { MapView } from './MapView'
import { ZoomControls } from './ZoomControls'
import { Loading } from '../../../shared/components/Loading'
import { CourseSelector } from '../../course/components/CourseSelector'
import { CourseLayer } from '../../course/components/CourseLayer'

export function MapPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [map, setMap] = useState<L.Map | null>(null)
  const [courses, setCourses] = useState<Course[]>([])

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
        <CourseSelector
          courses={courses}
          onToggleCourse={handleToggleCourse}
          onToggleAll={handleToggleAll}
        />
        <ZoomControls map={map} />
        <CourseLayer map={map} courses={courses} />
      </div>
    </div>
  )
}
