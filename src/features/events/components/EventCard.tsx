import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Event } from '../../../shared/types'
import { canUseWebShare, shareEvent, packageEventForSharing } from '../../events/services/eventSharer'

interface EventCardProps {
  event: Event
  onDelete: (eventId: string) => void
}

/**
 * Display a single event card with name, date, and actions
 */
export function EventCard({ event, onDelete }: EventCardProps) {
  const navigate = useNavigate()
  const [isSharing, setIsSharing] = useState(false)

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

    // Try Web Share API first (mobile iOS/Android)
    if (canUseWebShare()) {
      try {
        setIsSharing(true)
        await shareEvent(event.id)
        // Successfully shared via native dialog
        console.log('Event shared successfully via Web Share API')
        setIsSharing(false)
        return
      } catch (error: any) {
        setIsSharing(false)

        if (error.name === 'AbortError') {
          // User cancelled share dialog - not an error
          console.log('User cancelled share')
          return
        }

        // Share failed - fall back to export
        console.warn('Web Share API failed, falling back to export:', error)
      }
    }

    // Fallback: Export files for manual sharing
    await handleExport(e)
  }

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      setIsSharing(true)

      // Package event into files
      const files = await packageEventForSharing(event.id)

      // Download each file individually (browser support is universal)
      const filesToDownload = [
        files.manifest,
        files.mapImage,
        ...(files.worldFile ? [files.worldFile] : []),
        files.courseFile
      ]

      // Download files sequentially with small delay
      for (let i = 0; i < filesToDownload.length; i++) {
        const file = filesToDownload[i]
        const url = URL.createObjectURL(file)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        a.click()
        URL.revokeObjectURL(url)

        // Small delay between downloads to avoid browser blocking
        if (i < filesToDownload.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      alert(
        `✅ Event files downloaded!\n\n` +
        `Downloaded ${filesToDownload.length} files:\n` +
        `- ${files.manifest.name}\n` +
        `- ${files.mapImage.name}\n` +
        `${files.worldFile ? `- ${files.worldFile.name}\n` : ''}` +
        `- ${files.courseFile.name}\n\n` +
        `Share these files with others. Recipients should use "Import Event" to add them to their app.`
      )
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export event files. Please try again.')
    } finally {
      setIsSharing(false)
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
            disabled={isSharing}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title={canUseWebShare() ? 'Share event files via native share dialog' : 'Export event files for sharing'}
          >
            {isSharing ? 'Preparing...' : 'Share/Export'}
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
