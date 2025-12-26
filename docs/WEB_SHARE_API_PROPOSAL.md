# Web Share API for Event Sharing - Technical Proposal

## Problem Statement

Current "Share" feature only copies a URL, which doesn't transfer event data. Recipients must manually upload the same map and course files, making sharing ineffective.

## Proposed Solution: Web Share API

Use the Web Share API to share actual event data as files, enabling true one-click sharing between devices.

## How It Works

### 1. Package Event Data

When user clicks "Share", create shareable files:

```typescript
// src/features/events/services/eventSharer.ts
import { Event } from '../../../shared/types'
import { db } from '../../../db/schema'

interface ShareableEventPackage {
  manifest: File      // event-manifest.json
  mapImage: File      // map.jpg
  worldFile?: File    // map.jgw (if applicable)
  courseFile: File    // course.xml
}

export async function packageEventForSharing(eventId: string): Promise<ShareableEventPackage> {
  const event = await db.events.get(eventId)
  if (!event) throw new Error('Event not found')

  // 1. Create manifest file with metadata
  const manifest = {
    version: '1.0',
    appName: 'Forest Team',
    eventName: event.name,
    eventDate: event.date,
    courses: event.courses.map(c => ({
      id: c.id,
      name: c.name,
      controlCount: c.controls.length
    })),
    georeferencing: event.map.georef,
    exportedAt: new Date().toISOString()
  }

  const manifestBlob = new Blob(
    [JSON.stringify(manifest, null, 2)],
    { type: 'application/json' }
  )
  const manifestFile = new File(
    [manifestBlob],
    `${sanitizeFilename(event.name)}-manifest.json`,
    { type: 'application/json' }
  )

  // 2. Get map image from IndexedDB
  const mapFile = new File(
    [event.map.imageBlob],
    `${sanitizeFilename(event.name)}-map.jpg`,
    { type: 'image/jpeg' }
  )

  // 3. Reconstruct world file if applicable
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
      `${sanitizeFilename(event.name)}-map.jgw`,
      { type: 'text/plain' }
    )
  }

  // 4. Reconstruct course XML
  const courseXML = generateIOFXML(event.courses, event.name, event.date)
  const courseBlob = new Blob([courseXML], { type: 'application/xml' })
  const courseFile = new File(
    [courseBlob],
    `${sanitizeFilename(event.name)}-courses.xml`,
    { type: 'application/xml' }
  )

  return {
    manifest: manifestFile,
    mapImage: mapFile,
    worldFile,
    courseFile
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
}

function generateIOFXML(courses: Course[], eventName: string, eventDate: string): string {
  // Reconstruct IOF XML v3 from stored course data
  // This would be the reverse of the courseParser
  return `<?xml version="1.0" encoding="UTF-8"?>
<CourseData xmlns="http://www.orienteering.org/datastandard/3.0">
  <Event>
    <Name>${eventName}</Name>
    <StartTime>
      <Date>${eventDate}</Date>
    </StartTime>
  </Event>
  <!-- ... full XML reconstruction ... -->
</CourseData>`
}
```

### 2. Trigger Native Share Dialog

```typescript
// src/features/events/components/EventCard.tsx
import { packageEventForSharing, canUseWebShare } from '../services/eventSharer'

export function EventCard({ event, onDelete }: EventCardProps) {
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()

    // Check if Web Share API with files is supported
    if (!canUseWebShare()) {
      // Fallback to current URL-only sharing
      return handleLegacyShare()
    }

    try {
      setIsSharing(true)

      // Package event data into files
      const files = await packageEventForSharing(event.id)

      // Prepare files array (excluding undefined worldFile if KMZ)
      const filesToShare = [
        files.manifest,
        files.mapImage,
        files.courseFile,
        ...(files.worldFile ? [files.worldFile] : [])
      ]

      // Use Web Share API
      await navigator.share({
        title: `Forest Team Event: ${event.name}`,
        text: `Sharing orienteering event "${event.name}" from Forest Team app`,
        files: filesToShare
      })

      console.log('Event shared successfully')
    } catch (error) {
      if (error.name === 'AbortError') {
        // User cancelled share dialog - not an error
        console.log('User cancelled share')
      } else {
        console.error('Share failed:', error)
        alert('Failed to share event. Please try again.')
      }
    } finally {
      setIsSharing(false)
    }
  }

  const handleLegacyShare = async () => {
    // Fallback: Current URL-only sharing with warning
    const url = `${window.location.origin}/map/${event.id}`
    await navigator.clipboard.writeText(url)
    alert('⚠️ File sharing not supported on this device...')
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* ... */}
      <button
        onClick={handleShare}
        disabled={isSharing}
        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
      >
        {isSharing ? 'Preparing...' : 'Share'}
      </button>
    </div>
  )
}
```

### 3. Feature Detection

```typescript
// src/features/events/services/eventSharer.ts
export function canUseWebShare(): boolean {
  // Check if Web Share API is available
  if (!('share' in navigator)) {
    return false
  }

  // Check if files can be shared (Level 2 API)
  if (!('canShare' in navigator)) {
    return false
  }

  // Test with a dummy file
  const testFile = new File([''], 'test.txt', { type: 'text/plain' })
  return navigator.canShare({ files: [testFile] })
}
```

### 4. Recipient Imports Files

Create an import flow that detects shared Forest Team packages:

```typescript
// src/features/upload/components/ImportSharedEvent.tsx
export function ImportSharedEvent() {
  const [files, setFiles] = useState<FileList | null>(null)

  const handleImport = async () => {
    if (!files) return

    // Look for manifest file
    const manifestFile = Array.from(files).find(f =>
      f.name.endsWith('-manifest.json')
    )

    if (!manifestFile) {
      alert('This does not appear to be a shared Forest Team event')
      return
    }

    try {
      // Read manifest
      const manifestText = await manifestFile.text()
      const manifest = JSON.parse(manifestText)

      // Validate it's a Forest Team export
      if (manifest.appName !== 'Forest Team') {
        throw new Error('Invalid event package')
      }

      // Find matching files
      const mapFile = Array.from(files).find(f => f.name.endsWith('.jpg'))
      const worldFile = Array.from(files).find(f => f.name.endsWith('.jgw'))
      const courseFile = Array.from(files).find(f => f.name.endsWith('.xml'))

      if (!mapFile || !courseFile) {
        throw new Error('Missing required files (map or course)')
      }

      // Process files using existing upload logic
      await processEventUpload({
        name: manifest.eventName,
        date: manifest.eventDate,
        mapFile,
        worldFile,
        courseFile
      })

      alert(`Successfully imported "${manifest.eventName}"!`)
    } catch (error) {
      console.error('Import failed:', error)
      alert('Failed to import event. Please check the files.')
    }
  }

  return (
    <div>
      <h2>Import Shared Event</h2>
      <input
        type="file"
        multiple
        onChange={(e) => setFiles(e.target.files)}
        accept=".json,.jpg,.jgw,.xml"
      />
      <button onClick={handleImport}>Import</button>
    </div>
  )
}
```

## User Experience Flow

### Sender (Person sharing)

1. Go to Events page
2. Click **"Share"** on an event
3. Native share dialog appears (iOS share sheet, Android share menu)
4. Choose recipient method:
   - **AirDrop** (iOS to iOS)
   - **Messages** (text/iMessage)
   - **Email**
   - **WhatsApp/Telegram**
   - **Save to Files**
5. Recipient receives 3-4 files:
   - `spring-classic-manifest.json`
   - `spring-classic-map.jpg`
   - `spring-classic-map.jgw` (if applicable)
   - `spring-classic-courses.xml`

### Recipient (Person receiving)

**Option A: Automatic Import (future enhancement)**
1. Tap the manifest file
2. System recognizes it as Forest Team data
3. Opens Forest Team app automatically
4. Imports all files in one click

**Option B: Manual Import (initial version)**
1. Receive files via AirDrop/Messages/etc
2. Open Forest Team app
3. Go to "Import Shared Event"
4. Select all received files
5. Click "Import"
6. Event appears in their Events list

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| **iOS Safari 14+** | ✅ Full support | Works with AirDrop, Messages |
| **Android Chrome 89+** | ✅ Full support | Works with all Android sharing |
| **Desktop Chrome** | ⚠️ Limited | Can share but fewer targets |
| **Desktop Safari** | ⚠️ Limited | Can share but fewer targets |
| **Firefox** | ❌ No support | Falls back to URL sharing |

Check support: [caniuse.com/web-share](https://caniuse.com/web-share)

## Advantages

### ✅ True Data Transfer
- Recipients get actual files, not just a URL
- No need to coordinate file uploads separately
- Data travels with the share action

### ✅ Native Experience
- Uses familiar share dialog
- Works with AirDrop, Messages, Email, WhatsApp
- Feels like sharing a photo or document

### ✅ Offline-First Preserved
- Still works completely offline after import
- No backend required
- Privacy maintained (no server sees data)

### ✅ Progressive Enhancement
- Falls back to URL sharing on unsupported browsers
- Doesn't break existing functionality

## Disadvantages

### ❌ Browser Support Limitations
- Not supported in Firefox
- Desktop experience is less polished
- Requires relatively modern browsers (2021+)

### ❌ User Education Required
- Recipients need to know how to import files
- More steps than a simple URL click
- Manifest + multiple files might confuse users

### ❌ File Size Limits
- Some share targets limit file sizes
- Email attachments typically limited to 25MB
- WhatsApp limits to 16MB per file

### ❌ Implementation Complexity
- Need to reconstruct IOF XML from stored data
- Need import flow UI
- Need manifest format versioning

## Implementation Phases

### Phase 1: Basic Web Share (1-2 days)
- Implement `packageEventForSharing()`
- Add Web Share button with feature detection
- Fallback to current URL sharing
- Test on iOS/Android

### Phase 2: Import Flow (1-2 days)
- Create import UI for shared events
- Detect manifest files automatically
- Validate imported data
- Test end-to-end sharing flow

### Phase 3: Polish (1 day)
- Better error messages
- Loading states during packaging
- Automatic file association (tap manifest → open app)
- Optimize file sizes (compress images if needed)

### Phase 4: Advanced Features (optional)
- Selective course sharing (share only some courses)
- Event merging (import courses into existing event)
- Version migration (handle different manifest versions)

## Alternative: Simplified File Export

A simpler alternative that doesn't use Web Share API:

```typescript
// Just create a download button
const handleExport = async () => {
  const files = await packageEventForSharing(event.id)

  // Create a ZIP file
  const zip = new JSZip()
  zip.file('manifest.json', files.manifest)
  zip.file('map.jpg', files.mapImage)
  if (files.worldFile) zip.file('map.jgw', files.worldFile)
  zip.file('courses.xml', files.courseFile)

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(zipBlob)

  // Trigger download
  const a = document.createElement('a')
  a.href = url
  a.download = `${event.name}.forestteam.zip`
  a.click()

  URL.revokeObjectURL(url)
}
```

This gives users a `.forestteam.zip` file they can share however they want (email, Dropbox, etc), and recipients can import it.

## Recommendation

**Implement Web Share API with ZIP export fallback:**

1. **Mobile (iOS/Android)**: Use Web Share API for native sharing
2. **Desktop/Unsupported**: Provide ZIP download + email option
3. **Import**: Support both individual files and .forestteam.zip packages

This gives the best experience on mobile (where Forest Team is primarily used) while maintaining desktop compatibility.

## Code Estimate

- **eventSharer.ts**: ~200 lines
- **EventCard.tsx updates**: ~50 lines
- **ImportSharedEvent.tsx**: ~150 lines
- **IOF XML reconstruction**: ~100 lines
- **ZIP handling**: ~50 lines
- **Tests**: ~200 lines

**Total**: ~750 lines of code, 3-4 days implementation

## Security Considerations

- Validate manifest format before import
- Sanitize filenames to prevent directory traversal
- Limit total package size (e.g., 50MB max)
- Validate file types match expected (JPEG, XML, etc)
- Don't execute any code from manifest
- Version manifest format for future compatibility

## Conclusion

The Web Share API provides a native, user-friendly solution to the sharing limitation while maintaining the offline-first architecture. It requires more implementation work than the current URL-only approach, but delivers true event sharing that users expect.
