import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

          if (parsed.appName !== 'Forest Team') {
            setError('Invalid ZIP file - not a Forest Team event export')
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

        // Validate it's a Forest Team manifest
        if (parsed.appName !== 'Forest Team') {
          setError('Invalid manifest file - not a Forest Team event export')
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

    if (manifestData.appName !== 'Forest Team') {
      throw new Error('Invalid manifest - not a Forest Team export')
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

    if (manifestData.appName !== 'Forest Team') {
      throw new Error('Invalid manifest - not a Forest Team export')
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
    navigate('/events')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-forest-800 text-white py-4 px-6">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold">Import Shared Event</h1>
          <p className="text-sm text-forest-100 mt-1">
            Import an event that was shared with you
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto max-w-4xl p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Instructions */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">How to Import</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Receive event files from the sender (via AirDrop, email, etc.)</li>
              <li>Select all files below (3-4 files total)</li>
              <li>Click "Import Event" to add it to your app</li>
            </ol>
          </div>

          {/* File input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Event Files
            </label>
            <input
              type="file"
              accept=".zip,.forestteam.zip"
              onChange={handleFilesSelected}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-forest-50 file:text-forest-700 hover:file:bg-forest-100"
            />
            <p className="mt-2 text-sm text-gray-500">
              Select a .forestteam.zip file exported from Forest Team
            </p>
          </div>

          {/* Manifest preview */}
          {manifest && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-medium text-blue-900 mb-2">Event Preview</h3>
              <dl className="space-y-1 text-sm">
                <div>
                  <dt className="inline font-medium">Name:</dt>
                  <dd className="inline ml-2">{manifest.eventName}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">Date:</dt>
                  <dd className="inline ml-2">{new Date(manifest.eventDate).toLocaleDateString()}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">Courses:</dt>
                  <dd className="inline ml-2">{manifest.courses.length}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">Exported:</dt>
                  <dd className="inline ml-2">{new Date(manifest.exportedAt).toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Files selected */}
          {selectedFiles && selectedFiles.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">
                Selected Files ({selectedFiles.length})
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                {Array.from(selectedFiles).map((file, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-gray-400">•</span>
                    <span className="font-mono">{file.name}</span>
                    <span className="text-gray-400">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleImport}
              disabled={!selectedFiles || selectedFiles.length === 0 || importing}
              className="flex-1"
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
          </div>
        </div>

        {/* Help text */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-medium text-yellow-900 mb-2">Need Help?</h3>
          <p className="text-sm text-yellow-800">
            If you're having trouble importing, make sure you've selected all the files
            that were shared with you. The manifest.json file is required, along with
            the map image and course file.
          </p>
        </div>
      </main>
    </div>
  )
}
