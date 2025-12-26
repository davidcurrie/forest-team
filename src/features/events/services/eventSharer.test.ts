import { describe, it, expect, vi, beforeEach } from 'vitest'
import { canUseWebShare, packageEventForSharing, shareEvent } from './eventSharer'
import { db } from '../../../db/schema'
import type { Event } from '../../../shared/types'

describe('eventSharer', () => {
  const mockEvent: Event = {
    id: 'test-event-1',
    name: 'Test Event 2024',
    date: '2024-06-15',
    createdAt: new Date('2024-06-01'),
    isDemo: false,
    courses: [
      {
        id: 'course-1',
        name: 'Course A',
        start: { lat: 51.5, lng: -0.1 },
        finish: { lat: 51.51, lng: -0.11 },
        controls: [
          {
            id: 'ctrl-1',
            code: '101',
            position: { lat: 51.505, lng: -0.105 },
            number: 1
          }
        ],
        color: '#FF0000',
        visible: true
      }
    ],
    map: {
      imageBlob: new Blob(['fake image data'], { type: 'image/jpeg' }),
      bounds: {
        north: 51.52,
        south: 51.48,
        east: -0.08,
        west: -0.12
      },
      georef: {
        type: 'worldfile',
        pixelSizeX: 0.0001,
        pixelSizeY: -0.0001,
        rotationX: 0,
        rotationY: 0,
        topLeftX: -0.12,
        topLeftY: 51.52
      }
    }
  }

  beforeEach(() => {
    // Mock navigator.share
    Object.defineProperty(navigator, 'share', {
      value: vi.fn().mockResolvedValue(undefined),
      writable: true,
      configurable: true
    })

    Object.defineProperty(navigator, 'canShare', {
      value: vi.fn().mockReturnValue(true),
      writable: true,
      configurable: true
    })

    // Mock database
    vi.spyOn(db.events, 'get').mockResolvedValue(mockEvent)
  })

  describe('canUseWebShare', () => {
    it('returns true when Web Share API with files is supported', () => {
      expect(canUseWebShare()).toBe(true)
    })

    it('returns false when navigator.share is not available', () => {
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        configurable: true
      })

      expect(canUseWebShare()).toBe(false)
    })

    it('returns false when navigator.canShare is not available', () => {
      Object.defineProperty(navigator, 'canShare', {
        value: undefined,
        configurable: true
      })

      expect(canUseWebShare()).toBe(false)
    })

    it('returns false when file sharing is not supported', () => {
      Object.defineProperty(navigator, 'canShare', {
        value: vi.fn().mockReturnValue(false),
        configurable: true
      })

      expect(canUseWebShare()).toBe(false)
    })
  })

  describe('packageEventForSharing', () => {
    it('creates manifest file with correct metadata', async () => {
      const pkg = await packageEventForSharing('test-event-1')

      expect(pkg.manifest.name).toMatch(/test-event-2024-manifest\.json/)
      expect(pkg.manifest.type).toBe('application/json')

      const manifestText = await pkg.manifest.text()
      const manifest = JSON.parse(manifestText)

      expect(manifest.appName).toBe('Forest Team')
      expect(manifest.eventName).toBe('Test Event 2024')
      expect(manifest.eventDate).toBe('2024-06-15')
      expect(manifest.courses).toHaveLength(1)
      expect(manifest.courses[0].name).toBe('Course A')
      expect(manifest.courses[0].controlCount).toBe(1)
    })

    it('creates map image file', async () => {
      const pkg = await packageEventForSharing('test-event-1')

      expect(pkg.mapImage.name).toMatch(/test-event-2024-map\.jpg/)
      expect(pkg.mapImage.type).toBe('image/jpeg')
    })

    it('creates world file for worldfile georeferencing', async () => {
      const pkg = await packageEventForSharing('test-event-1')

      expect(pkg.worldFile).toBeDefined()
      expect(pkg.worldFile?.name).toMatch(/test-event-2024-map\.jgw/)
      expect(pkg.worldFile?.type).toBe('text/plain')

      const jgwContent = await pkg.worldFile?.text()
      const lines = jgwContent?.split('\n')

      expect(lines).toHaveLength(6)
      expect(lines?.[0]).toBe('0.0001')  // pixelSizeX
      expect(lines?.[1]).toBe('0')       // rotationX
      expect(lines?.[2]).toBe('0')       // rotationY
      expect(lines?.[3]).toBe('-0.0001') // pixelSizeY
      expect(lines?.[4]).toBe('-0.12')   // topLeftX
      expect(lines?.[5]).toBe('51.52')   // topLeftY
    })

    it('does not create world file for KMZ georeferencing', async () => {
      const kmzEvent = {
        ...mockEvent,
        map: {
          ...mockEvent.map,
          georef: {
            ...mockEvent.map.georef,
            type: 'kmz' as const
          }
        }
      }
      vi.spyOn(db.events, 'get').mockResolvedValue(kmzEvent)

      const pkg = await packageEventForSharing('test-event-1')

      expect(pkg.worldFile).toBeUndefined()
    })

    it('creates IOF XML course file', async () => {
      const pkg = await packageEventForSharing('test-event-1')

      expect(pkg.courseFile.name).toMatch(/test-event-2024-courses\.xml/)
      expect(pkg.courseFile.type).toBe('application/xml')

      const xmlContent = await pkg.courseFile.text()

      expect(xmlContent).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(xmlContent).toContain('<CourseData xmlns="http://www.orienteering.org/datastandard/3.0">')
      expect(xmlContent).toContain('<Name>Test Event 2024</Name>')
      expect(xmlContent).toContain('<Course>')
      expect(xmlContent).toContain('<Name>Course A</Name>')
      expect(xmlContent).toContain('lat="51.5" lng="-0.1"')
      expect(xmlContent).toContain('101')
    })

    it('sanitizes filename correctly', async () => {
      const specialEvent = {
        ...mockEvent,
        name: 'Test Event! @#$% 2024 (Final)'
      }
      vi.spyOn(db.events, 'get').mockResolvedValue(specialEvent)

      const pkg = await packageEventForSharing('test-event-1')

      expect(pkg.manifest.name).toMatch(/test-event-2024-final-manifest\.json/)
      expect(pkg.manifest.name).not.toContain('!')
      expect(pkg.manifest.name).not.toContain('@')
      expect(pkg.manifest.name).not.toContain('(')
    })

    it('throws error when event not found', async () => {
      vi.spyOn(db.events, 'get').mockResolvedValue(undefined)

      await expect(packageEventForSharing('nonexistent')).rejects.toThrow('Event not found')
    })
  })

  describe('shareEvent', () => {
    it('calls navigator.share with packaged files', async () => {
      const shareSpy = vi.spyOn(navigator, 'share')

      await shareEvent('test-event-1')

      expect(shareSpy).toHaveBeenCalledWith({
        title: 'Forest Team Event: Test Event 2024',
        text: 'Orienteering event "Test Event 2024" - Open in Forest Team app',
        files: expect.arrayContaining([
          expect.objectContaining({ name: expect.stringMatching(/manifest\.json/) }),
          expect.objectContaining({ name: expect.stringMatching(/map\.jpg/) }),
          expect.objectContaining({ name: expect.stringMatching(/map\.jgw/) }),
          expect.objectContaining({ name: expect.stringMatching(/courses\.xml/) })
        ])
      })
    })

    it('throws error when Web Share API not supported', async () => {
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        configurable: true
      })

      await expect(shareEvent('test-event-1')).rejects.toThrow('Web Share API not supported')
    })

    it('throws error when event not found', async () => {
      vi.spyOn(db.events, 'get').mockResolvedValue(undefined)

      await expect(shareEvent('nonexistent')).rejects.toThrow('Event not found')
    })

    it('handles user cancellation gracefully', async () => {
      const cancelError = new Error('Share cancelled')
      cancelError.name = 'AbortError'
      vi.spyOn(navigator, 'share').mockRejectedValue(cancelError)

      // Should propagate AbortError so caller can handle it
      await expect(shareEvent('test-event-1')).rejects.toThrow('AbortError')
    })
  })

  describe('IOF XML generation', () => {
    it('includes multiple courses', async () => {
      const multiCourseEvent = {
        ...mockEvent,
        courses: [
          mockEvent.courses[0],
          {
            id: 'course-2',
            name: 'Course B',
            start: { lat: 51.5, lng: -0.1 },
            finish: { lat: 51.51, lng: -0.11 },
            controls: [
              {
                id: 'ctrl-2',
                code: '201',
                position: { lat: 51.506, lng: -0.106 },
                number: 1
              }
            ],
            color: '#0000FF',
            visible: true
          }
        ]
      }
      vi.spyOn(db.events, 'get').mockResolvedValue(multiCourseEvent)

      const pkg = await packageEventForSharing('test-event-1')
      const xmlContent = await pkg.courseFile.text()

      // Should have two <Course> elements
      const courseMatches = xmlContent.match(/<Course>/g)
      expect(courseMatches).toHaveLength(2)

      expect(xmlContent).toContain('<Name>Course A</Name>')
      expect(xmlContent).toContain('<Name>Course B</Name>')
      expect(xmlContent).toContain('101')
      expect(xmlContent).toContain('201')
    })

    it('escapes XML special characters in names', async () => {
      const specialEvent = {
        ...mockEvent,
        name: 'Test & Event <2024>',
        courses: [{
          ...mockEvent.courses[0],
          name: 'Course "A" & \'B\''
        }]
      }
      vi.spyOn(db.events, 'get').mockResolvedValue(specialEvent)

      const pkg = await packageEventForSharing('test-event-1')
      const xmlContent = await pkg.courseFile.text()

      expect(xmlContent).toContain('Test &amp; Event &lt;2024&gt;')
      expect(xmlContent).toContain('Course &quot;A&quot; &amp; &apos;B&apos;')
    })

    it('includes all control positions with sequence numbers', async () => {
      const pkg = await packageEventForSharing('test-event-1')
      const xmlContent = await pkg.courseFile.text()

      expect(xmlContent).toContain('<Sequence>1</Sequence>')
      expect(xmlContent).toContain('lat="51.505" lng="-0.105"')
    })
  })
})
