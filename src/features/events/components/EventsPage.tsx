import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Event } from '../../../shared/types'
import { db } from '../../../db/schema'
import { EventList } from './EventList'
import { Loading } from '../../../shared/components/Loading'

/**
 * Events page - list and manage all stored events
 */
export function EventsPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [storageUsage, setStorageUsage] = useState<{ used: number; total: number } | null>(null)

  useEffect(() => {
    loadEvents()
    loadStorageUsage()
  }, [])

  const loadEvents = async () => {
    try {
      const allEvents = await db.events.toArray()
      setEvents(allEvents)
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStorageUsage = async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        setStorageUsage({
          used: estimate.usage || 0,
          total: estimate.quota || 0
        })
      } catch (error) {
        console.error('Failed to get storage estimate:', error)
      }
    }
  }

  const handleDelete = async (eventId: string) => {
    try {
      await db.events.delete(eventId)
      setEvents(prevEvents => prevEvents.filter(e => e.id !== eventId))
      loadStorageUsage() // Refresh storage after deletion
    } catch (error) {
      console.error('Failed to delete event:', error)
      alert('Failed to delete event. Please try again.')
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const getStoragePercentage = (): number => {
    if (!storageUsage || storageUsage.total === 0) return 0
    return (storageUsage.used / storageUsage.total) * 100
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-forest-800 text-white py-4 px-6">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Events</h1>
            <p className="text-sm text-forest-100">
              {events.length} event{events.length !== 1 ? 's' : ''} stored
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-forest-700 hover:bg-forest-600 rounded transition-colors"
          >
            ← Home
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto max-w-4xl p-6">
        {/* Storage usage */}
        {storageUsage && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Storage Usage</span>
              <span className="text-sm text-gray-600">
                {formatBytes(storageUsage.used)} / {formatBytes(storageUsage.total)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  getStoragePercentage() > 80 ? 'bg-red-600' :
                  getStoragePercentage() > 60 ? 'bg-yellow-600' :
                  'bg-forest-600'
                }`}
                style={{ width: `${Math.min(100, getStoragePercentage())}%` }}
              />
            </div>
            {getStoragePercentage() > 80 && (
              <p className="text-xs text-red-600 mt-2">
                Storage is running low. Consider deleting old events.
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/upload')}
            className="px-6 py-3 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors font-medium"
          >
            + Upload New Event
          </button>
          <button
            onClick={() => navigate('/import')}
            className="px-6 py-3 bg-white border-2 border-forest-600 text-forest-700 rounded-lg hover:bg-forest-50 transition-colors font-medium"
          >
            📥 Import Shared Event
          </button>
        </div>

        {/* Event list */}
        <EventList events={events} onDelete={handleDelete} />
      </main>
    </div>
  )
}
