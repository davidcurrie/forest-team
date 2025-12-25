import { describe, it, expect } from 'vitest'
import { calculateLineWidth, extractUniqueControls, getStartTriangleVertex } from './courseRenderer'
import { Course, Position } from '../../../shared/types'

describe('courseRenderer', () => {
  describe('calculateLineWidth', () => {
    it('calculates correct line width at zoom 15', () => {
      const width = calculateLineWidth(15, 51)
      // At zoom 15, latitude 51, should be around 1-3 pixels
      expect(width).toBeGreaterThan(0)
      expect(width).toBeLessThanOrEqual(10)
    })

    it('returns smaller width at lower zoom levels', () => {
      const widthLow = calculateLineWidth(10, 51)
      const widthHigh = calculateLineWidth(18, 51)
      // Higher zoom = more detail = wider lines
      expect(widthHigh).toBeGreaterThan(widthLow)
    })

    it('clamps width between 1 and 10 pixels', () => {
      const widthVeryLow = calculateLineWidth(5, 51)
      const widthVeryHigh = calculateLineWidth(20, 51)
      expect(widthVeryLow).toBeGreaterThanOrEqual(1)
      expect(widthVeryHigh).toBeLessThanOrEqual(10)
    })
  })

  describe('extractUniqueControls', () => {
    it('extracts unique controls from multiple courses', () => {
      const courses: Course[] = [
        {
          id: 'course1',
          name: 'Course 1',
          color: '#ff0000',
          visible: true,
          start: { lat: 0, lng: 0 },
          finish: { lat: 1, lng: 1 },
          controls: [
            { id: 'c1', code: '101', number: 1, position: { lat: 0.1, lng: 0.1 } },
            { id: 'c2', code: '102', number: 2, position: { lat: 0.2, lng: 0.2 } },
          ],
        },
        {
          id: 'course2',
          name: 'Course 2',
          color: '#00ff00',
          visible: true,
          start: { lat: 0, lng: 0 },
          finish: { lat: 1, lng: 1 },
          controls: [
            { id: 'c3', code: '101', number: 1, position: { lat: 0.1, lng: 0.1 } }, // Same as course1 c1
            { id: 'c4', code: '103', number: 2, position: { lat: 0.3, lng: 0.3 } },
          ],
        },
      ]

      const uniqueControls = extractUniqueControls(courses)

      // Should have 3 unique controls (101, 102, 103)
      expect(uniqueControls).toHaveLength(3)

      // Control 101 should have 2 courses
      const control101 = uniqueControls.find(c => c.code === '101')
      expect(control101).toBeDefined()
      expect(control101?.courses).toHaveLength(2)
      expect(control101?.courses[0].courseName).toBe('Course 1')
      expect(control101?.courses[1].courseName).toBe('Course 2')
    })

    it('handles courses with no controls', () => {
      const courses: Course[] = [
        {
          id: 'course1',
          name: 'Course 1',
          color: '#ff0000',
          visible: true,
          start: { lat: 0, lng: 0 },
          finish: { lat: 1, lng: 1 },
          controls: [],
        },
      ]

      const uniqueControls = extractUniqueControls(courses)
      expect(uniqueControls).toHaveLength(0)
    })
  })

  describe('getStartTriangleVertex', () => {
    it('returns start position when no first control', () => {
      const start: Position = { lat: 51.5, lng: -0.1 }
      const vertex = getStartTriangleVertex(start, null)

      expect(vertex[0]).toBe(start.lat)
      expect(vertex[1]).toBe(start.lng)
    })

    it('calculates vertex pointing toward first control', () => {
      const start: Position = { lat: 51.5, lng: -0.1 }
      const firstControl: Position = { lat: 51.51, lng: -0.09 } // Northeast of start

      const vertex = getStartTriangleVertex(start, firstControl)

      // Vertex should be northeast of start (higher lat, higher lng)
      expect(vertex[0]).toBeGreaterThan(start.lat)
      expect(vertex[1]).toBeGreaterThan(start.lng)
    })

    it('vertex is approximately 52m from start center', () => {
      const start: Position = { lat: 51.5, lng: -0.1 }
      const firstControl: Position = { lat: 51.51, lng: -0.1 }

      const vertex = getStartTriangleVertex(start, firstControl)

      // Distance from center to vertex should be sideLength / sqrt(3) ≈ 52m
      // At 51.5° latitude, 1° ≈ 111320m lat, ≈ 69467m lng
      const latDiff = (vertex[0] - start.lat) * 111320
      const lngDiff = (vertex[1] - start.lng) * 69467
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff)

      // Should be around 52m (90 / sqrt(3))
      expect(distance).toBeGreaterThan(50)
      expect(distance).toBeLessThan(54)
    })
  })
})
