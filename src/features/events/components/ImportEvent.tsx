import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { db } from '../../../db/schema'
import { processJpegWorldFile, type ParsedMapData } from '../../upload/services/mapProcessor'
import { parseCourseData } from '../../upload/services/courseParser'
import type { Event, Course } from '../../../shared/types'
import { Button } from '../../../shared/components/Button'
import JSZip from 'jszip'

interface EventManifest {
  version: string
  appName: string
  appVersion?: string
  eventName: string
  eventDate: string
  exportedAt: string
  courses: {
    id: string
    name: string
    controlCount: number
  }[]
  georeferencing: {
    type: 'worldfile' | 'kmz'
    pixelSizeX: number
    pixelSizeY: number
    rotationX: number
    rotationY: number
    topLeftX: number
    topLeftY: number
  }
}

/**
 * Import Event component - allows users to import events shared via files
 */
export function ImportEvent() {
  const navigate = useNavigate()
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manifest, setManifest] = useState<EventManifest | null>(null)

  const getImageDimensions = (blob: Blob): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(blob)

      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve({ width: img.width, height: img.height })
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      img.src = url
    })
  }

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    setSelectedFiles(files)
    setError(null)
    setManifest(null)

    if (!files || files.length === 0) return

    // Check if it's a ZIP file
    if (files.length === 1 && files[0].name.endsWith('.zip')) {
      try {
        const zipFile = files[0]
        const zip = await JSZip.loadAsync(zipFile)

        // Try to find manifest in ZIP
        const manifestEntry = zip.file(/manifest\.json$/i)[0]
        if (manifestEntry) {
          const text = await manifestEntry.async('text')
          const parsed = JSON.parse(text) as EventManifest

          if (parsed.appName !== 'Course View') {
            setError('Invalid ZIP file - not a Course View event export')
            return
          }

          setManifest(parsed)
        }
      } catch (err) {
        console.error('Failed to read ZIP file:', err)
        setError('Invalid ZIP file format')
      }
      return
    }

    // Try to find and parse manifest file from individual files
    const manifestFile = Array.from(files).find(f =>
      f.name.endsWith('-manifest.json') || f.name === 'manifest.json'
    )

    if (manifestFile) {
      try {
        const text = await manifestFile.text()
        const parsed = JSON.parse(text) as EventManifest

        // Validate it's a Course View manifest
        if (parsed.appName !== 'Course View') {
          setError('Invalid manifest file - not a Course View event export')
          return
        }

        setManifest(parsed)
      } catch (err) {
        console.error('Failed to parse manifest:', err)
        setError('Invalid manifest file format')
      }
    }
  }

  const handleImport = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError('Please select a file to import')
      return
    }

    setImporting(true)
    setError(null)

    try {
      // Check if it's a ZIP file
      if (selectedFiles.length === 1 && selectedFiles[0].name.endsWith('.zip')) {
        await importFromZip(selectedFiles[0])
      } else {
        await importFromIndividualFiles(Array.from(selectedFiles))
      }
    } catch (err: any) {
      console.error('Import failed:', err)
      setError(err.message || 'Failed to import event. Please check your files.')
      setImporting(false)
    }
  }

  const importFromZip = async (zipFile: File) => {
    const zip = await JSZip.loadAsync(zipFile)

    // 1. Find and validate manifest
    const manifestEntry = zip.file(/manifest\.json$/i)[0]
    if (!manifestEntry) {
      throw new Error('Manifest file not found in ZIP')
    }

    const manifestText = await manifestEntry.async('text')
    const manifestData = JSON.parse(manifestText) as EventManifest

    if (manifestData.appName !== 'Course View') {
      throw new Error('Invalid manifest - not a Course View export')
    }

    // 2. Find required files
    const mapEntry = zip.file(/\.jpg$/i)[0]
    if (!mapEntry) {
      throw new Error('Map image file (.jpg) not found in ZIP')
    }

    const worldEntry = zip.file(/\.jgw$/i)[0]

    const courseEntry = zip.file(/\.xml$/i)[0]
    if (!courseEntry) {
      throw new Error('Course file (.xml) not found in ZIP')
    }

    // 3. Extract files as blobs
    const mapBlob = await mapEntry.async('blob')
    const mapFile = new File([mapBlob], mapEntry.name, { type: 'image/jpeg' })

    let worldFile: File | undefined
    if (worldEntry) {
      const worldBlob = await worldEntry.async('blob')
      worldFile = new File([worldBlob], worldEntry.name, { type: 'text/plain' })
    }

    const courseBlob = await courseEntry.async('blob')
    const courseFile = new File([courseBlob], courseEntry.name, { type: 'application/xml' })

    // 4. Process files
    await processImportedFiles(manifestData, mapFile, worldFile, courseFile)
  }

  const importFromIndividualFiles = async (filesArray: File[]) => {
    // 1. Find and validate manifest
    const manifestFile = filesArray.find(f =>
      f.name.endsWith('-manifest.json') || f.name === 'manifest.json'
    )

    if (!manifestFile) {
      throw new Error('Manifest file not found. Please select all exported files.')
    }

    const manifestText = await manifestFile.text()
    const manifestData = JSON.parse(manifestText) as EventManifest

    if (manifestData.appName !== 'Course View') {
      throw new Error('Invalid manifest - not a Course View export')
    }

    // 2. Find required files
    const mapFile = filesArray.find(f =>
      f.type === 'image/jpeg' || f.name.endsWith('.jpg')
    )

    if (!mapFile) {
      throw new Error('Map image file (.jpg) not found')
    }

    const worldFile = filesArray.find(f => f.name.endsWith('.jgw'))

    const courseFile = filesArray.find(f =>
      f.type === 'application/xml' || f.name.endsWith('.xml')
    )

    if (!courseFile) {
      throw new Error('Course file (.xml) not found')
    }

    // 3. Process files
    await processImportedFiles(manifestData, mapFile, worldFile, courseFile)
  }

  const processImportedFiles = async (
    manifestData: EventManifest,
    mapFile: File,
    worldFile: File | undefined,
    courseFile: File
  ) => {
    // 1. Process map files
    let mapData: ParsedMapData

      if (worldFile) {
        // JPEG + JGW
        mapData = await processJpegWorldFile(mapFile, worldFile)
      } else {
        // Just JPEG - use georef from manifest and calculate bounds
        const imageBlob = await mapFile.arrayBuffer().then(buf => new Blob([buf], { type: 'image/jpeg' }))

        // Get image dimensions
        const dimensions = await getImageDimensions(imageBlob)

        // Calculate bounds from georef and image dimensions
        const georef = manifestData.georeferencing
        const west = georef.topLeftX
        const north = georef.topLeftY
        const east = west + (dimensions.width * georef.pixelSizeX)
        const south = north + (dimensions.height * georef.pixelSizeY)

        mapData = {
          imageBlob,
          bounds: {
            north: Math.max(north, south), // pixelSizeY is negative, so south < north
            south: Math.min(north, south),
            east: Math.max(west, east),
            west: Math.min(west, east)
          },
          georef: {
            type: georef.type,
            pixelSizeX: georef.pixelSizeX,
            pixelSizeY: georef.pixelSizeY,
            rotationX: georef.rotationX,
            rotationY: georef.rotationY,
            topLeftX: georef.topLeftX,
            topLeftY: georef.topLeftY
          }
        }
      }

    // 2. Parse course file
    const courseText = await courseFile.text()
    const courses: Course[] = await parseCourseData(courseText)

    if (courses.length === 0) {
      throw new Error('No courses found in course file')
    }

    // 3. Create event object
    const event: Event = {
      id: crypto.randomUUID(),
      name: manifestData.eventName,
      date: manifestData.eventDate,
      createdAt: new Date(),
      isDemo: false,
      courses,
      map: {
        imageBlob: mapData.imageBlob,
        bounds: mapData.bounds,
        georef: mapData.georef
      }
    }

    // 4. Save to database
    await db.events.add(event)

    alert(`✅ Successfully imported "${event.name}"!\n\n${courses.length} course${courses.length !== 1 ? 's' : ''} imported.`)

    // Navigate to the new event
    navigate(`/map/${event.id}`)
  }

  const handleCancel = () => {
    navigate('/')
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="static">
        <Toolbar>
          <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleCancel}
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box
              component="img"
              src="/course-view/favicon-32x32.png"
              alt="Course View"
              sx={{ width: 32, height: 32, mr: 1 }}
            />
            <Box>
              <Typography variant="h5" component="h1" fontWeight="bold">
                Import Shared Event
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Import an event that was shared with you
              </Typography>
            </Box>
          </Container>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 3 }}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={3}>
              {/* Instructions */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  How to Import
                </Typography>
                <List
                  component="ol"
                  sx={{
                    listStyleType: 'decimal',
                    pl: 3,
                    '& .MuiListItem-root': {
                      display: 'list-item',
                    },
                  }}
                >
                  <ListItem disablePadding>
                    <Typography variant="body2" color="text.secondary">
                      Receive event files from the sender (via AirDrop, email, etc.)
                    </Typography>
                  </ListItem>
                  <ListItem disablePadding>
                    <Typography variant="body2" color="text.secondary">
                      Select all files below (3-4 files total)
                    </Typography>
                  </ListItem>
                  <ListItem disablePadding>
                    <Typography variant="body2" color="text.secondary">
                      Click "Import Event" to add it to your app
                    </Typography>
                  </ListItem>
                </List>
              </Box>

              {/* File input */}
              <Box>
                <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                  Select Event Files
                </Typography>
                <Box
                  component="input"
                  type="file"
                  accept=".zip,.course-view.zip"
                  onChange={handleFilesSelected}
                  sx={{
                    display: 'block',
                    width: '100%',
                    fontSize: '0.875rem',
                    color: 'text.secondary',
                    '&::file-selector-button': {
                      mr: 2,
                      py: 1,
                      px: 2,
                      border: 'none',
                      borderRadius: 1,
                      bgcolor: 'primary.50',
                      color: 'primary.main',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'primary.100',
                      },
                    },
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Select a .course-view.zip file exported from Course View
                </Typography>
              </Box>

              {/* Manifest preview */}
              {manifest && (
                <Alert severity="info">
                  <AlertTitle>Event Preview</AlertTitle>
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      <Box component="span" fontWeight="medium">Name:</Box> {manifest.eventName}
                    </Typography>
                    <Typography variant="body2">
                      <Box component="span" fontWeight="medium">Date:</Box>{' '}
                      {new Date(manifest.eventDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2">
                      <Box component="span" fontWeight="medium">Courses:</Box> {manifest.courses.length}
                    </Typography>
                    <Typography variant="body2">
                      <Box component="span" fontWeight="medium">Exported:</Box>{' '}
                      {new Date(manifest.exportedAt).toLocaleString()}
                    </Typography>
                  </Stack>
                </Alert>
              )}

              {/* Files selected */}
              {selectedFiles && selectedFiles.length > 0 && (
                <Box>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    Selected Files ({selectedFiles.length})
                  </Typography>
                  <List dense>
                    {Array.from(selectedFiles).map((file, idx) => (
                      <ListItem key={idx} disablePadding>
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          • {file.name}{' '}
                          <Box component="span" sx={{ color: 'text.disabled' }}>
                            ({(file.size / 1024).toFixed(1)} KB)
                          </Box>
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Error message */}
              {error && (
                <Alert severity="error">
                  <Typography variant="body2">{error}</Typography>
                </Alert>
              )}

              {/* Actions */}
              <Stack direction="row" spacing={2}>
                <Button
                  onClick={handleImport}
                  disabled={!selectedFiles || selectedFiles.length === 0 || importing}
                  sx={{ flex: 1 }}
                >
                  {importing ? 'Importing...' : 'Import Event'}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="secondary"
                  disabled={importing}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Help text */}
        <Alert severity="warning" sx={{ mt: 3 }}>
          <AlertTitle>Need Help?</AlertTitle>
          <Typography variant="body2">
            If you're having trouble importing, make sure you've selected all the files
            that were shared with you. The manifest.json file is required, along with
            the map image and course file.
          </Typography>
        </Alert>
      </Container>
    </Box>
  )
}
