/**
 * Event sharing service using Web Share API
 *
 * Enables true event data sharing by packaging event files
 * and using the native share dialog on supported devices.
 *
 * @see docs/WEB_SHARE_API_PROPOSAL.md for full specification
 */

import { db } from '../../../db/schema'
import type { Event, Position } from '../../../shared/types'
import JSZip from 'jszip'

interface ShareableEventPackage {
  manifest: File
  mapImage: File
  worldFile?: File
  courseFile: File
}

interface EventManifest {
  version: string
  appName: string
  appVersion: string
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
 * Check if Web Share API with file support is available
 */
export function canUseWebShare(): boolean {
  // Check if Web Share API exists
  if (!('share' in navigator)) {
    return false
  }

  // Check if we can share files (Level 2 API)
  if (!('canShare' in navigator)) {
    return false
  }

  // Test with a dummy file to confirm file sharing works
  try {
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    return navigator.canShare({ files: [testFile] })
  } catch {
    return false
  }
}

/**
 * Package an event into shareable files
 */
export async function packageEventForSharing(eventId: string): Promise<ShareableEventPackage> {
  const event = await db.events.get(eventId)
  if (!event) {
    throw new Error('Event not found')
  }

  const baseFilename = sanitizeFilename(event.name)

  // 1. Create manifest file
  const manifest: EventManifest = {
    version: '1.0',
    appName: 'Forest Team',
    appVersion: '1.0.0',
    eventName: event.name,
    eventDate: event.date,
    exportedAt: new Date().toISOString(),
    courses: event.courses.map(c => ({
      id: c.id,
      name: c.name,
      controlCount: c.controls.length
    })),
    georeferencing: {
      type: event.map.georef.type,
      pixelSizeX: event.map.georef.pixelSizeX,
      pixelSizeY: event.map.georef.pixelSizeY,
      rotationX: event.map.georef.rotationX,
      rotationY: event.map.georef.rotationY,
      topLeftX: event.map.georef.topLeftX,
      topLeftY: event.map.georef.topLeftY
    }
  }

  const manifestBlob = new Blob(
    [JSON.stringify(manifest, null, 2)],
    { type: 'application/json' }
  )
  const manifestFile = new File(
    [manifestBlob],
    `${baseFilename}-manifest.json`,
    { type: 'application/json' }
  )

  // 2. Get map image
  const mapFile = new File(
    [event.map.imageBlob],
    `${baseFilename}-map.jpg`,
    { type: 'image/jpeg' }
  )

  // 3. Create world file if applicable
  let worldFile: File | undefined
  if (event.map.georef.type === 'worldfile') {
    const jgwContent = [
      event.map.georef.pixelSizeX,
      event.map.georef.rotationX,
      event.map.georef.rotationY,
      event.map.georef.pixelSizeY,
      event.map.georef.topLeftX,
      event.map.georef.topLeftY
    ].join('\n')

    const jgwBlob = new Blob([jgwContent], { type: 'text/plain' })
    worldFile = new File(
      [jgwBlob],
      `${baseFilename}-map.jgw`,
      { type: 'text/plain' }
    )
  }

  // 4. Reconstruct IOF XML from stored course data
  const courseXML = generateIOFXML(event)
  const courseBlob = new Blob([courseXML], { type: 'application/xml' })
  const courseFile = new File(
    [courseBlob],
    `${baseFilename}-courses.xml`,
    { type: 'application/xml' }
  )

  return {
    manifest: manifestFile,
    mapImage: mapFile,
    worldFile,
    courseFile
  }
}

/**
 * Share an event using Web Share API
 */
export async function shareEvent(eventId: string): Promise<void> {
  if (!canUseWebShare()) {
    throw new Error('Web Share API not supported')
  }

  // Package the event
  const packagedEvent = await packageEventForSharing(eventId)

  // Prepare files array
  const filesToShare = [
    packagedEvent.manifest,
    packagedEvent.mapImage,
    packagedEvent.courseFile,
    ...(packagedEvent.worldFile ? [packagedEvent.worldFile] : [])
  ]

  const event = await db.events.get(eventId)
  if (!event) throw new Error('Event not found')

  // Trigger native share dialog
  await navigator.share({
    title: `Forest Team Event: ${event.name}`,
    text: `Orienteering event "${event.name}" - Open in Forest Team app`,
    files: filesToShare
  })
}

/**
 * Sanitize filename for safe file creation
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
}

/**
 * Generate IOF XML v3 from stored course data
 *
 * This reconstructs the original IOF XML format from our internal representation
 */
function generateIOFXML(event: Event): string {
  const escapeXML = (value: any): string => {
    // Convert to string if not already
    const str = String(value ?? '')
    return str.replace(/&/g, '&amp;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;')
       .replace(/'/g, '&apos;')
  }

  const xml: string[] = []

  xml.push('<?xml version="1.0" encoding="UTF-8"?>')
  xml.push('<CourseData xmlns="http://www.orienteering.org/datastandard/3.0">')
  xml.push('  <RaceCourseData>')

  // Collect all unique controls across all courses
  const controlsMap = new Map<string, { id: string, position: Position, code?: string }>()

  event.courses.forEach(course => {
    // Add start as a control
    const startId = `start-${course.id}`
    if (!controlsMap.has(startId)) {
      controlsMap.set(startId, {
        id: startId,
        position: course.start,
        code: 'S1'
      })
    }

    // Add all controls
    course.controls.forEach(control => {
      if (!controlsMap.has(control.id)) {
        controlsMap.set(control.id, {
          id: control.id,
          position: control.position,
          code: control.code
        })
      }
    })

    // Add finish as a control
    const finishId = `finish-${course.id}`
    if (!controlsMap.has(finishId)) {
      controlsMap.set(finishId, {
        id: finishId,
        position: course.finish,
        code: 'F1'
      })
    }
  })

  // Output all controls
  controlsMap.forEach(control => {
    xml.push('    <Control>')
    xml.push(`      <Id>${escapeXML(control.id)}</Id>`)
    if (control.code) {
      xml.push(`      <Code>${escapeXML(control.code)}</Code>`)
    }
    xml.push('      <Position lat="' + control.position.lat + '" lng="' + control.position.lng + '"/>')
    xml.push('    </Control>')
  })

  // Add courses
  event.courses.forEach(course => {
    xml.push('    <Course>')
    xml.push(`      <Name>${escapeXML(course.name)}</Name>`)

    // Start
    xml.push('      <CourseControl type="Start">')
    xml.push(`        <Control>start-${course.id}</Control>`)
    xml.push('      </CourseControl>')

    // Controls
    course.controls.forEach(control => {
      xml.push('      <CourseControl type="Control">')
      xml.push(`        <Control>${escapeXML(control.id)}</Control>`)
      xml.push('      </CourseControl>')
    })

    // Finish
    xml.push('      <CourseControl type="Finish">')
    xml.push(`        <Control>finish-${course.id}</Control>`)
    xml.push('      </CourseControl>')

    xml.push('    </Course>')
  })

  xml.push('  </RaceCourseData>')
  xml.push('</CourseData>')

  return xml.join('\n')
}

/**
 * Export event as a single ZIP file
 * Works in all browsers as a fallback to Web Share API
 */
export async function exportEventAsZip(eventId: string): Promise<Blob> {
  const files = await packageEventForSharing(eventId)
  const event = await db.events.get(eventId)

  if (!event) {
    throw new Error('Event not found')
  }

  const zip = new JSZip()

  // Add all files to zip
  zip.file(files.manifest.name, files.manifest)
  zip.file(files.mapImage.name, files.mapImage)
  if (files.worldFile) {
    zip.file(files.worldFile.name, files.worldFile)
  }
  zip.file(files.courseFile.name, files.courseFile)

  // Generate ZIP blob
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  })

  return zipBlob
}
