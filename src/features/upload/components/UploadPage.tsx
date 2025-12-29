import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { MapUpload } from './MapUpload'
import { CourseUpload } from './CourseUpload'
import { ValidationErrors } from './ValidationErrors'
import { Button } from '../../../shared/components/Button'
import { processJpegWorldFile } from '../services/mapProcessor'
import { processKmzFile } from '../services/kmzProcessor'
import { parseCourseData } from '../services/courseParser'
import {
  validateMapUpload,
  validateKmzFile,
  validateCourseFile,
  validateCourseFileContent,
} from '../services/fileValidator'
import { createEvent } from '../../events/services/eventStorage'

export function UploadPage() {
  const navigate = useNavigate()

  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [mapFiles, setMapFiles] = useState<{ image: File; world?: File } | null>(null)
  const [courseFile, setCourseFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleMapSelect = (imageFile: File, worldFile?: File) => {
    setMapFiles({ image: imageFile, world: worldFile })
    setErrors([])
  }

  const handleCourseSelect = (file: File) => {
    setCourseFile(file)
    setErrors([])
  }

  const handleSubmit = async () => {
    const validationErrors: string[] = []

    // Validate event details
    if (!eventName.trim()) {
      validationErrors.push('Event name is required')
    }

    if (!eventDate) {
      validationErrors.push('Event date is required')
    }

    if (!mapFiles) {
      validationErrors.push('Map file is required')
    }

    if (!courseFile) {
      validationErrors.push('Course file is required')
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsProcessing(true)
    setErrors([])

    try {
      // Validate and process map
      let mapData
      if (mapFiles!.world) {
        // JPEG + World File
        const validation = await validateMapUpload(mapFiles!.image, mapFiles!.world)
        if (!validation.valid) {
          setErrors(validation.errors)
          setIsProcessing(false)
          return
        }
        mapData = await processJpegWorldFile(mapFiles!.image, mapFiles!.world)
      } else {
        // KMZ
        const validation = validateKmzFile(mapFiles!.image)
        if (!validation.valid) {
          setErrors(validation.errors)
          setIsProcessing(false)
          return
        }
        mapData = await processKmzFile(mapFiles!.image)
      }

      // Validate and process course file
      const courseValidation = validateCourseFile(courseFile!)
      if (!courseValidation.valid) {
        setErrors(courseValidation.errors)
        setIsProcessing(false)
        return
      }

      const courseContentValidation = await validateCourseFileContent(courseFile!)
      if (!courseContentValidation.valid) {
        setErrors(courseContentValidation.errors)
        setIsProcessing(false)
        return
      }

      const courseText = await courseFile!.text()
      const courses = await parseCourseData(courseText)

      // Create and save event
      const event = await createEvent(eventName, eventDate, mapData, courses, false)

      // Navigate to map view
      navigate(`/map/${event.id}`)
    } catch (error) {
      console.error('Upload error:', error)
      setErrors([
        error instanceof Error ? error.message : 'An unexpected error occurred during upload',
      ])
      setIsProcessing(false)
    }
  }

  const canSubmit = eventName && eventDate && mapFiles && courseFile && !isProcessing

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="static">
        <Toolbar>
          <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => navigate('/')}
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h5" component="h1" fontWeight="bold">
                Upload Event Data
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Upload map and course files for a new event
              </Typography>
            </Box>
          </Container>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 3 }}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={3}>
              {/* Event Details */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Event Details
                </Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <TextField
                    label="Event Name"
                    required
                    fullWidth
                    value={eventName}
                    onChange={e => setEventName(e.target.value)}
                    placeholder="e.g., Spring Series Event 1"
                    disabled={isProcessing}
                  />
                  <TextField
                    label="Event Date"
                    required
                    fullWidth
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    disabled={isProcessing}
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
              </Box>

              <Divider />

              {/* Map Upload */}
              <MapUpload onMapSelect={handleMapSelect} />

              <Divider />

              {/* Course Upload */}
              <CourseUpload onCourseSelect={handleCourseSelect} />

              {/* Validation Errors */}
              {errors.length > 0 && (
                <Box sx={{ pt: 2 }}>
                  <ValidationErrors errors={errors} />
                </Box>
              )}

              {/* Submit Buttons */}
              <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
                <Button onClick={() => navigate('/')} variant="secondary" disabled={isProcessing}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  sx={{ flex: 1 }}
                  startIcon={isProcessing ? <CircularProgress size={16} color="inherit" /> : undefined}
                >
                  {isProcessing ? 'Processing...' : 'Create Event'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
