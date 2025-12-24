import L from 'leaflet'
import { Course, Position } from '../../../shared/types'

type CoordinateTransform = (pos: Position) => [number, number]

/**
 * Represents a unique control with all courses that visit it
 */
export interface UniqueControl {
  code: string
  position: Position
  courses: Array<{
    courseId: string
    courseName: string
    courseColor: string
    controlNumber: number
  }>
}

/**
 * Extract unique controls from all courses
 */
export function extractUniqueControls(courses: Course[]): UniqueControl[] {
  const controlMap = new Map<string, UniqueControl>()

  courses.forEach(course => {
    course.controls.forEach(control => {
      // Use code + position as unique key
      const key = `${control.code}_${control.position.lat}_${control.position.lng}`

      if (!controlMap.has(key)) {
        controlMap.set(key, {
          code: control.code,
          position: control.position,
          courses: []
        })
      }

      const uniqueControl = controlMap.get(key)!
      uniqueControl.courses.push({
        courseId: course.id,
        courseName: course.name,
        courseColor: course.color,
        controlNumber: control.number
      })
    })
  })

  return Array.from(controlMap.values())
}

/**
 * Create a start marker (triangle)
 */
export function createStartMarker(
  position: Position,
  color: string,
  courseName: string,
  transform: CoordinateTransform = pos => [pos.lat, pos.lng]
): L.Marker {
  const icon = L.divIcon({
    className: 'orienteering-start-marker',
    html: `
      <svg width="30" height="30" viewBox="0 0 30 30">
        <polygon points="15,5 25,25 5,25" fill="none" stroke="${color}" stroke-width="3"/>
      </svg>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })

  const coords = transform(position)
  const marker = L.marker(coords, { icon })

  // Add popup
  marker.bindPopup(`
    <div style="font-family: Arial, sans-serif; min-width: 120px;">
      <div style="font-weight: bold; margin-bottom: 4px;">Start</div>
      <div style="font-size: 12px; color: #666;">Course: ${courseName}</div>
    </div>
  `, {
    closeButton: true,
    minWidth: 120,
  })

  return marker
}

/**
 * Create a control marker (circle with code label)
 * Shows all courses that visit this control
 * Circle is 75m diameter (37.5m radius) and scales with zoom
 */
export function createControlMarker(
  uniqueControl: UniqueControl,
  transform: CoordinateTransform = pos => [pos.lat, pos.lng]
): L.LayerGroup {
  const coords = transform(uniqueControl.position)
  const layerGroup = L.layerGroup()

  // Create circle with 37.5m radius (75m diameter)
  const circle = L.circle(coords, {
    radius: 37.5, // 75m diameter
    fillColor: 'transparent',
    fillOpacity: 0,
    color: '#e63946',
    weight: 3,
    interactive: false, // Don't block clicks, let the marker handle them
  })
  circle.addTo(layerGroup)

  // Create marker for the label (positioned to the right of the circle)
  const labelIcon = L.divIcon({
    className: 'orienteering-control-label',
    html: `
      <div style="position: relative; white-space: nowrap; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; color: #e63946; text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff; margin-left: 45px;">
        ${uniqueControl.code}
      </div>
    `,
    iconSize: [100, 20],
    iconAnchor: [0, 10],
  })

  const labelMarker = L.marker(coords, {
    icon: labelIcon,
    interactive: true, // This marker handles clicks
  })
  labelMarker.addTo(layerGroup)

  // Add popup with all courses visiting this control
  const coursesList = uniqueControl.courses
    .map(c => `
      <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
        <div style="width: 12px; height: 12px; background-color: ${c.courseColor}; border-radius: 2px;"></div>
        <span style="font-size: 12px;">${c.courseName} - Control ${c.controlNumber}</span>
      </div>
    `)
    .join('')

  const popupContent = `
    <div style="font-family: Arial, sans-serif; min-width: 180px;">
      <div style="font-weight: bold; margin-bottom: 8px;">Control ${uniqueControl.code}</div>
      <div style="font-size: 11px; color: #666; margin-bottom: 6px;">Courses:</div>
      ${coursesList}
    </div>
  `

  labelMarker.bindPopup(popupContent, {
    closeButton: true,
    minWidth: 180,
  })

  return layerGroup
}

/**
 * Create a finish marker (double circle)
 */
export function createFinishMarker(
  position: Position,
  color: string,
  courseName: string,
  transform: CoordinateTransform = pos => [pos.lat, pos.lng]
): L.Marker {
  const icon = L.divIcon({
    className: 'orienteering-finish-marker',
    html: `
      <svg width="30" height="30" viewBox="0 0 30 30">
        <circle cx="15" cy="15" r="10" fill="none" stroke="${color}" stroke-width="3"/>
        <circle cx="15" cy="15" r="6" fill="none" stroke="${color}" stroke-width="3"/>
      </svg>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })

  const coords = transform(position)
  const marker = L.marker(coords, { icon })

  // Add popup
  marker.bindPopup(`
    <div style="font-family: Arial, sans-serif; min-width: 120px;">
      <div style="font-weight: bold; margin-bottom: 4px;">Finish</div>
      <div style="font-size: 12px; color: #666;">Course: ${courseName}</div>
    </div>
  `, {
    closeButton: true,
    minWidth: 120,
  })

  return marker
}

/**
 * Calculate point at edge of a circle
 * @param from The point the line is coming from
 * @param center The center of the circle
 * @param radiusMeters The radius of the circle in meters
 * @param transform Coordinate transformation function
 */
function getCircleEdgePoint(
  from: Position,
  center: Position,
  radiusMeters: number,
  transform: CoordinateTransform
): [number, number] {
  const fromCoords = transform(from)
  const centerCoords = transform(center)

  // Calculate direction vector from 'from' to center
  const dx = centerCoords[1] - fromCoords[1] // X difference
  const dy = centerCoords[0] - fromCoords[0] // Y difference
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance === 0) return centerCoords

  // Normalize direction vector
  const dirX = dx / distance
  const dirY = dy / distance

  // Convert radius from meters to approximate degrees
  // At equator: 1 degree ≈ 111,320 meters
  // This is an approximation that works reasonably well for small distances
  const radiusDegrees = radiusMeters / 111320

  // Move back from center by radius
  return [
    centerCoords[0] - dirY * radiusDegrees,
    centerCoords[1] - dirX * radiusDegrees
  ]
}

/**
 * Calculate point at edge of finish circle
 */
function getFinishEdgePoint(
  lastControl: Position,
  finish: Position,
  transform: CoordinateTransform
): [number, number] {
  // Finish marker has ~10m radius (approximation)
  return getCircleEdgePoint(lastControl, finish, 10, transform)
}

/**
 * Create polyline segments connecting course controls
 * Each segment stops at control circle edges, creating gaps at controls
 * Returns an array of polylines
 */
export function createCoursePolylines(
  course: Course,
  transform: CoordinateTransform = pos => [pos.lat, pos.lng]
): L.Polyline[] {
  const polylines: L.Polyline[] = []
  const controlRadius = 37.5 // Control circle radius in meters

  const polylineOptions: L.PolylineOptions = {
    color: course.color,
    weight: 3,
    opacity: 0.7,
    lineJoin: 'round' as const,
    lineCap: 'round' as const,
  }

  if (course.controls.length === 0) {
    // No controls, just start to finish
    const positions = [
      transform(course.start),
      transform(course.finish)
    ]
    polylines.push(L.polyline(positions, polylineOptions))
    return polylines
  }

  // Segment 1: Start to first control
  const firstControlEntry = getCircleEdgePoint(
    course.start,
    course.controls[0].position,
    controlRadius,
    transform
  )
  polylines.push(L.polyline([
    transform(course.start),
    firstControlEntry
  ], polylineOptions))

  // Segments between controls
  for (let i = 0; i < course.controls.length - 1; i++) {
    const currentControl = course.controls[i]
    const nextControl = course.controls[i + 1]

    // Exit edge of current control (toward next control)
    const exitEdge = getCircleEdgePoint(
      nextControl.position,
      currentControl.position,
      controlRadius,
      transform
    )

    // Entry edge of next control (from current control)
    const entryEdge = getCircleEdgePoint(
      currentControl.position,
      nextControl.position,
      controlRadius,
      transform
    )

    polylines.push(L.polyline([exitEdge, entryEdge], polylineOptions))
  }

  // Last segment: Last control to finish
  const lastControl = course.controls[course.controls.length - 1]
  const lastControlExit = getCircleEdgePoint(
    course.finish,
    lastControl.position,
    controlRadius,
    transform
  )
  const finishEntry = getFinishEdgePoint(lastControl.position, course.finish, transform)

  polylines.push(L.polyline([lastControlExit, finishEntry], polylineOptions))

  return polylines
}

/**
 * Create a layer group for a course (without adding to map)
 * Only includes course-specific elements: start, finish, and polyline segments
 * Controls are rendered separately in ControlsLayer
 */
export function createCourseLayer(
  course: Course,
  transform: CoordinateTransform = pos => [pos.lat, pos.lng]
): L.LayerGroup {
  const layerGroup = L.layerGroup()

  // Add course line segments (with gaps at controls)
  const polylines = createCoursePolylines(course, transform)
  polylines.forEach(polyline => polyline.addTo(layerGroup))

  // Add start marker
  const startMarker = createStartMarker(course.start, course.color, course.name, transform)
  startMarker.addTo(layerGroup)

  // Add finish marker
  const finishMarker = createFinishMarker(course.finish, course.color, course.name, transform)
  finishMarker.addTo(layerGroup)

  return layerGroup
}

/**
 * Create a layer group for all unique controls (always visible)
 */
export function createControlsLayer(
  uniqueControls: UniqueControl[],
  transform: CoordinateTransform = pos => [pos.lat, pos.lng]
): L.LayerGroup {
  const layerGroup = L.layerGroup()

  uniqueControls.forEach(uniqueControl => {
    const marker = createControlMarker(uniqueControl, transform)
    marker.addTo(layerGroup)
  })

  return layerGroup
}
