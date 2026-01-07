import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import LinearProgress from '@mui/material/LinearProgress'
import AddIcon from '@mui/icons-material/Add'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import { Event } from '../../../shared/types'
import { db } from '../../../db/schema'
import { EventList } from './EventList'
import { Loading } from '../../../shared/components/Loading'
import { Button } from '../../../shared/components'

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

  const getStorageColor = (): 'success' | 'warning' | 'error' => {
    const percentage = getStoragePercentage()
    if (percentage > 80) return 'error'
    if (percentage > 60) return 'warning'
    return 'success'
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Loading />
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src="/course-view/favicon-32x32.png"
              alt="Course View"
              sx={{ width: 32, height: 32 }}
            />
            <Typography variant="h5" component="h1" fontWeight="bold">
              Course View
            </Typography>
          </Container>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Container maxWidth="md" sx={{ py: 3 }}>
        {/* Action buttons */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/upload')}
            startIcon={<AddIcon />}
            fullWidth
          >
            Upload New Event
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/import')}
            startIcon={<FileDownloadIcon />}
            fullWidth
          >
            Import Shared Event
          </Button>
        </Stack>

        {/* Event list */}
        <EventList events={events} onDelete={handleDelete} />

        {/* Storage info */}
        <Box sx={{ mt: 3 }}>
          {/* Event count */}
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
            {events.length} event{events.length !== 1 ? 's' : ''} stored
          </Typography>

          {/* Storage usage */}
          {storageUsage && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    Storage Usage
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatBytes(storageUsage.used)} / {formatBytes(storageUsage.total)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, getStoragePercentage())}
                  color={getStorageColor()}
                  sx={{ height: 8, borderRadius: 1 }}
                />
                {getStoragePercentage() > 80 && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    Storage is running low. Consider deleting old events.
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      </Container>
    </Box>
  )
}
