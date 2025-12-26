/**
 * Event sharing service using Web Share API
 *
 * Enables true event data sharing by packaging event files
 * and using the native share dialog on supported devices.
 *
 * @see docs/WEB_SHARE_API_PROPOSAL.md for full specification
 */

import { db } from '../../../db/schema'
import type { Event } from '../../../shared/types'

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
  xml.push('  <Event>')
  xml.push(`    <Name>${escapeXML(event.name)}</Name>`)
  xml.push('    <StartTime>')
  xml.push(`      <Date>${event.date}</Date>`)
  xml.push('    </StartTime>')
  xml.push('  </Event>')

  // Add courses
  event.courses.forEach(course => {
    xml.push('  <Course>')
    xml.push(`    <Name>${escapeXML(course.name)}</Name>`)

    // Start
    xml.push('    <CourseControl type="Start">')
    xml.push('      <Control>')
    xml.push(`        <Position lat="${course.start.lat}" lng="${course.start.lng}"/>`)
    xml.push('      </Control>')
    xml.push('    </CourseControl>')

    // Controls
    course.controls.forEach((control, idx) => {
      xml.push('    <CourseControl type="Control">')
      xml.push(`      <Control>${escapeXML(control.code)}</Control>`)
      xml.push(`      <Sequence>${idx + 1}</Sequence>`)
      xml.push('      <Position>')
      xml.push(`        <Position lat="${control.position.lat}" lng="${control.position.lng}"/>`)
      xml.push('      </Position>')
      xml.push('    </CourseControl>')
    })

    // Finish
    xml.push('    <CourseControl type="Finish">')
    xml.push('      <Control>')
    xml.push(`        <Position lat="${course.finish.lat}" lng="${course.finish.lng}"/>`)
    xml.push('      </Control>')
    xml.push('    </CourseControl>')

    xml.push('  </Course>')
  })

  xml.push('</CourseData>')

  return xml.join('\n')
}

/**
 * Fallback: Export event as ZIP file download
 * For browsers that don't support Web Share API
 */
export async function exportEventAsZip(_eventId: string): Promise<void> {
  // This would require adding JSZip library
  // For now, we'll just provide individual file downloads
  throw new Error('ZIP export not yet implemented - use Web Share API or share URL instead')
}
