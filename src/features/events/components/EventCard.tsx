import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Event } from '../../../shared/types'

interface EventCardProps {
  event: Event
  onDelete: (eventId: string) => void
}

/**
 * Display a single event card with name, date, and actions
 */
export function EventCard({ event, onDelete }: EventCardProps) {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  const handleView = () => {
    navigate(`/map/${event.id}`)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Are you sure you want to delete "${event.name}"? This cannot be undone.`)) {
      onDelete(event.id)
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/map/${event.id}`

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      // Show informative alert about sharing limitation
      alert(
        `URL copied to clipboard!\n\n` +
        `⚠️ IMPORTANT: This URL does NOT transfer event data.\n\n` +
        `Recipients must:\n` +
        `1. Upload the same map files to their device\n` +
        `2. Upload the same course file\n` +
        `3. Then this URL will open their local copy\n\n` +
        `All data is stored locally for offline functionality.`
      )
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      // Fallback: show the URL in an alert
      alert(
        `Share this URL:\n${url}\n\n` +
        `⚠️ IMPORTANT: Recipients must upload the same files to their device first. ` +
        `The URL does not transfer event data.`
      )
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {event.name}
            </h3>
            {event.isDemo && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                Demo
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-3">
            {formatDate(event.date)}
          </p>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.857 9.809a.75.75 0 01-1.214.882l-3.483-4.79a.75.75 0 011.214-.882l3.483 4.79z"/>
            </svg>
            <span>{event.courses.length} course{event.courses.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleView}
            className="px-4 py-2 bg-forest-600 text-white rounded hover:bg-forest-700 transition-colors text-sm font-medium"
          >
            View Map
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            {copied ? '✓ Copied!' : 'Share'}
          </button>
          {!event.isDemo && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors text-sm font-medium"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
