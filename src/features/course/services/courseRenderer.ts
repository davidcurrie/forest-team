import L from 'leaflet'
import { Course, Position } from '../../../shared/types'

type CoordinateTransform = (pos: Position) => [number, number]

/**
 * Calculate appropriate line width in pixels for current zoom level
 * Target: 0.35mm on a 1:15,000 scale map = 5.25m on ground
 * @param zoom Current map zoom level
 * @param latitude Latitude for calculating resolution (default 51 for UK)
 */
export function calculateLineWidth(zoom: number, latitude: number = 51): number {
  // Web Mercator resolution: meters per pixel at given zoom and latitude
  const resolution = 156543.04 * Math.cos(latitude * Math.PI / 180) / Math.pow(2, zoom)

  // 0.35mm at 1:15,000 scale = 5.25m on ground
  const targetWidthMeters = 5.25

  // Calculate pixel width
  const pixelWidth = targetWidthMeters / resolution

  // Clamp between 1 and 10 pixels for usability
  return Math.max(1, Math.min(10, pixelWidth))
}

/**
 * Calculate appropriate font size in pixels for current zoom level
 * Target: 4mm on a 1:15,000 scale map = 60m on ground
 * @param zoom Current map zoom level
 * @param latitude Latitude for calculating resolution (default 51 for UK)
 */
export function calculateFontSize(zoom: number, latitude: number = 51): number {
  // Web Mercator resolution: meters per pixel at given zoom and latitude
  const resolution = 156543.04 * Math.cos(latitude * Math.PI / 180) / Math.pow(2, zoom)

  // 4mm at 1:15,000 scale = 60m on ground
  const targetHeightMeters = 60

  // Calculate pixel height - no clamping to maintain true scale
  return targetHeightMeters / resolution
}

/**
 * Represents a unique control with all courses that visit it
 */
export interface UniqueControl {
  code: string
  position: Position
  controlIds: string[] // IDs of all control instances at this position
  courses: Array<{
    courseId: string
    courseName: string
    courseColor: string
    controlNumber: number
  }>
}

/**
 * Represents a unique start position with all courses that use it
 */
export interface UniqueStart {
  position: Position
  courseNames: string[]
}

/**
 * Extract unique start positions from all courses
 */
export function extractUniqueStarts(courses: Course[]): UniqueStart[] {
  const startMap = new Map<string, UniqueStart>()

  courses.forEach(course => {
    const key = `${course.start.lat}_${course.start.lng}`

    if (!startMap.has(key)) {
      startMap.set(key, {
        position: course.start,
        courseNames: []
      })
    }

    const uniqueStart = startMap.get(key)!
    if (!uniqueStart.courseNames.includes(course.name)) {
      uniqueStart.courseNames.push(course.name)
    }
  })

  return Array.from(startMap.values())
}

/**
 * Extract unique finish positions from all courses
 */
export function extractUniqueFinishes(courses: Course[]): UniqueStart[] {
  const finishMap = new Map<string, UniqueStart>()

  courses.forEach(course => {
    const key = `${course.finish.lat}_${course.finish.lng}`

    if (!finishMap.has(key)) {
      finishMap.set(key, {
        position: course.finish,
        courseNames: []
      })
    }

    const uniqueFinish = finishMap.get(key)!
    if (!uniqueFinish.courseNames.includes(course.name)) {
      uniqueFinish.courseNames.push(course.name)
    }
  })

  return Array.from(finishMap.values())
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
          controlIds: [],
          courses: []
        })
      }

      const uniqueControl = controlMap.get(key)!

      // Add control ID if not already present
      if (!uniqueControl.controlIds.includes(control.id)) {
        uniqueControl.controlIds.push(control.id)
      }

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
 * Calculate bearing from one position to another (in degrees)
 */
function calculateBearing(from: Position, to: Position): number {
  const lat1 = from.lat * Math.PI / 180
  const lat2 = to.lat * Math.PI / 180
  const dLng = (to.lng - from.lng) * Math.PI / 180

  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)

  const bearing = Math.atan2(y, x) * 180 / Math.PI
  return (bearing + 360) % 360 // Normalize to 0-360
}

/**
 * Create a start marker (equilateral triangle) - always purple
 * Side length: 6mm at 1:15,000 = 90m on ground
 * Rotates to point toward first control
 */
export function createStartMarker(
  position: Position,
  firstControl: Position | null,
  courseName: string,
  transform: CoordinateTransform = pos => [pos.lat, pos.lng],
  zoom: number = 15
): L.LayerGroup {
  const coords = transform(position)
  const layerGroup = L.layerGroup()

  // Side length: 6mm at 1:15,000 = 90m
  const sideLength = 90 // meters

  // Calculate bearing to first control (0 = north, 90 = east)
  const bearing = firstControl ? calculateBearing(position, firstControl) : 0

  const lat = position.lat
  const metersPerDegreeLat = 111320
  const metersPerDegreeLng = 111320 * Math.cos(lat * Math.PI / 180)

  // For an equilateral triangle, all vertices are at the same distance from center
  // Distance from centroid to vertex = sideLength / sqrt(3)
  const radiusFromCenter = sideLength / Math.sqrt(3) // ~51.96m

  // Calculate rotated vertices (120 degrees apart)
  const bearingRad = bearing * Math.PI / 180

  // Top vertex (points in direction of first control)
  const topLat = coords[0] + (radiusFromCenter * Math.cos(bearingRad)) / metersPerDegreeLat
  const topLng = coords[1] + (radiusFromCenter * Math.sin(bearingRad)) / metersPerDegreeLng

  // Bottom right vertex (120 degrees clockwise from top)
  const brAngle = bearingRad + (2 * Math.PI / 3)
  const bottomRightLat = coords[0] + (radiusFromCenter * Math.cos(brAngle)) / metersPerDegreeLat
  const bottomRightLng = coords[1] + (radiusFromCenter * Math.sin(brAngle)) / metersPerDegreeLng

  // Bottom left vertex (120 degrees counter-clockwise from top)
  const blAngle = bearingRad - (2 * Math.PI / 3)
  const bottomLeftLat = coords[0] + (radiusFromCenter * Math.cos(blAngle)) / metersPerDegreeLat
  const bottomLeftLng = coords[1] + (radiusFromCenter * Math.sin(blAngle)) / metersPerDegreeLng

  const trianglePoints: L.LatLngExpression[] = [
    [topLat, topLng],
    [bottomRightLat, bottomRightLng],
    [bottomLeftLat, bottomLeftLng]
  ]

  const triangle = L.polygon(trianglePoints, {
    fillColor: 'transparent',
    fillOpacity: 0,
    color: '#9333ea',
    weight: calculateLineWidth(zoom),
  })
  triangle.addTo(layerGroup)

  // Add popup to triangle
  triangle.bindPopup(`
    <div style="font-family: Arial, sans-serif; min-width: 120px;">
      <div style="font-weight: bold; margin-bottom: 4px;">Start</div>
      <div style="font-size: 12px; color: #666;">Course: ${courseName}</div>
    </div>
  `, {
    closeButton: true,
    minWidth: 120,
  })

  return layerGroup
}

/**
 * Calculate the vertex of the start triangle that points toward the first control
 */
export function getStartTriangleVertex(
  start: Position,
  firstControl: Position | null,
  transform: CoordinateTransform = pos => [pos.lat, pos.lng]
): [number, number] {
  if (!firstControl) {
    return transform(start)
  }

  const coords = transform(start)
  const sideLength = 90
  const radiusFromCenter = sideLength / Math.sqrt(3) // Same as in createStartMarker

  const bearing = calculateBearing(start, firstControl)
  const bearingRad = bearing * Math.PI / 180

  const lat = start.lat
  const metersPerDegreeLat = 111320
  const metersPerDegreeLng = 111320 * Math.cos(lat * Math.PI / 180)

  const topLat = coords[0] + (radiusFromCenter * Math.cos(bearingRad)) / metersPerDegreeLat
  const topLng = coords[1] + (radiusFromCenter * Math.sin(bearingRad)) / metersPerDegreeLng

  return [topLat, topLng]
}

/**
 * Create a control marker (circle only, no label)
 * Shows all courses that visit this control in popup
 * Circle is 75m diameter (37.5m radius) and scales with zoom
 */
export function createControlMarker(
  uniqueControl: UniqueControl,
  transform: CoordinateTransform = pos => [pos.lat, pos.lng],
  zoom: number = 15,
  visited: boolean = false
): L.Circle {
  const coords = transform(uniqueControl.position)

  // Create circle with 37.5m radius (75m diameter)
  // Color changes from purple to green when visited
  const circle = L.circle(coords, {
    radius: 37.5, // 75m diameter
    fillColor: 'transparent',
    fillOpacity: 0,
    color: visited ? '#22c55e' : '#9333ea', // Green if visited, purple otherwise
    weight: calculateLineWidth(zoom), // Match line width scaling
    interactive: true, // Allow clicks for popup
  })

  // Add popup with all courses visiting this control
  const coursesList = uniqueControl.courses
    .map(c => `
      <div style="margin: 4px 0;">
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

  circle.bindPopup(popupContent, {
    closeButton: true,
    minWidth: 180,
  })

  return circle
}

/**
 * Create a finish marker (double circle) - always purple
 * Outer circle: 6mm at 1:15,000 = 90m diameter (45m radius)
 * Inner circle: 4mm at 1:15,000 = 60m diameter (30m radius)
 */
export function createFinishMarker(
  position: Position,
  courseName: string,
  transform: CoordinateTransform = pos => [pos.lat, pos.lng],
  zoom: number = 15
): L.LayerGroup {
  const coords = transform(position)
  const layerGroup = L.layerGroup()

  // Outer circle: 6mm at 1:15,000 = 90m diameter (45m radius)
  const outerCircle = L.circle(coords, {
    radius: 45,
    fillColor: 'transparent',
    fillOpacity: 0,
    color: '#9333ea',
    weight: calculateLineWidth(zoom),
  })
  outerCircle.addTo(layerGroup)

  // Inner circle: 4mm at 1:15,000 = 60m diameter (30m radius)
  const innerCircle = L.circle(coords, {
    radius: 30,
    fillColor: 'transparent',
    fillOpacity: 0,
    color: '#9333ea',
    weight: calculateLineWidth(zoom),
  })
  innerCircle.addTo(layerGroup)

  // Add popup to outer circle
  outerCircle.bindPopup(`
    <div style="font-family: Arial, sans-serif; min-width: 120px;">
      <div style="font-weight: bold; margin-bottom: 4px;">Finish</div>
      <div style="font-size: 12px; color: #666;">Course: ${courseName}</div>
    </div>
  `, {
    closeButton: true,
    minWidth: 120,
  })

  return layerGroup
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

  // Calculate direction vector in METERS (not degrees)
  const centerLat = center.lat
  const metersPerDegreeLat = 111320 // Constant for latitude
  const metersPerDegreeLng = 111320 * Math.cos(centerLat * Math.PI / 180) // Varies with latitude

  // Convert lat/lng differences to meters
  const dxMeters = (centerCoords[1] - fromCoords[1]) * metersPerDegreeLng  // Longitude to meters
  const dyMeters = (centerCoords[0] - fromCoords[0]) * metersPerDegreeLat  // Latitude to meters
  const distanceMeters = Math.sqrt(dxMeters * dxMeters + dyMeters * dyMeters)

  if (distanceMeters === 0) return centerCoords

  // Normalize direction vector in meters
  const dirXMeters = dxMeters / distanceMeters
  const dirYMeters = dyMeters / distanceMeters

  // Move back from center by radius in meters
  const offsetXMeters = dirXMeters * radiusMeters
  const offsetYMeters = dirYMeters * radiusMeters

  // Convert offset from meters back to degrees
  const offsetLng = offsetXMeters / metersPerDegreeLng
  const offsetLat = offsetYMeters / metersPerDegreeLat

  // Move back from center by the offset
  return [
    centerCoords[0] - offsetLat,  // Latitude
    centerCoords[1] - offsetLng   // Longitude
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
  // Finish outer circle has 45m radius (6mm at 1:15,000)
  return getCircleEdgePoint(lastControl, finish, 45, transform)
}

/**
 * Create polyline segments connecting course controls
 * Each segment stops at control circle edges, creating gaps at controls
 * Returns an array of polylines
 */
export function createCoursePolylines(
  course: Course,
  transform: CoordinateTransform = pos => [pos.lat, pos.lng],
  zoom: number = 15
): L.Polyline[] {
  const polylines: L.Polyline[] = []
  const controlRadius = 37.5 // Control circle radius in meters

  const polylineOptions: L.PolylineOptions = {
    color: '#9c27b0', // Material UI purple
    weight: calculateLineWidth(zoom),
    opacity: 0.7,
    lineJoin: 'round' as const,
    lineCap: 'round' as const,
  }

  if (course.controls.length === 0) {
    // No controls, just start to finish
    const startVertex = getStartTriangleVertex(course.start, null, transform)
    const positions = [
      startVertex,
      transform(course.finish)
    ]
    polylines.push(L.polyline(positions, polylineOptions))
    return polylines
  }

  // Segment 1: Start vertex to first control edge
  const startVertex = getStartTriangleVertex(course.start, course.controls[0].position, transform)
  const firstControlEntry = getCircleEdgePoint(
    course.start,
    course.controls[0].position,
    controlRadius,
    transform
  )
  polylines.push(L.polyline([
    startVertex,
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
 * Only includes course-specific elements: start, finish, and optionally polyline segments
 * Controls are rendered separately in ControlsLayer
 */
export function createCourseLayer(
  course: Course,
  transform: CoordinateTransform = pos => [pos.lat, pos.lng],
  zoom: number = 15,
  includePolylines: boolean = true
): L.LayerGroup {
  const layerGroup = L.layerGroup()

  // Add course line segments (with gaps at controls) if requested
  if (includePolylines) {
    const polylines = createCoursePolylines(course, transform, zoom)
    polylines.forEach(polyline => polyline.addTo(layerGroup))
  }

  // Add start marker
  const firstControl = course.controls.length > 0 ? course.controls[0].position : null
  const startMarker = createStartMarker(course.start, firstControl, course.name, transform, zoom)
  startMarker.addTo(layerGroup)

  // Add finish marker
  const finishMarker = createFinishMarker(course.finish, course.name, transform, zoom)
  finishMarker.addTo(layerGroup)

  return layerGroup
}

/**
 * Calculate distance between two positions in meters
 */
function calculateDistance(pos1: [number, number], pos2: [number, number]): number {
  const lat1 = pos1[0]
  const lng1 = pos1[1]
  const lat2 = pos2[0]
  const lng2 = pos2[1]

  const metersPerDegreeLat = 111320
  const metersPerDegreeLng = 111320 * Math.cos((lat1 + lat2) / 2 * Math.PI / 180)

  const dLat = (lat2 - lat1) * metersPerDegreeLat
  const dLng = (lng2 - lng1) * metersPerDegreeLng

  return Math.sqrt(dLat * dLat + dLng * dLng)
}

/**
 * Calculate average of two angles, handling wraparound correctly
 */
function averageAngles(angle1: number, angle2: number): number {
  const diff = ((angle2 - angle1 + 540) % 360) - 180
  return (angle1 + diff / 2 + 360) % 360
}

/**
 * Calculate the offset distance for a label based on its size
 * Ensures the label is positioned just outside the circle without touching
 */
function calculateLabelOffset(controlNumber: number): number {
  // Circle radius in meters
  const circleRadius = 37.5

  // Text height is always 60m (4mm at 1:15,000 scale)
  const textHeightMeters = 60

  // Text width: approximately 60% of height per digit
  const numDigits = controlNumber.toString().length
  const textWidthMeters = textHeightMeters * 0.6 * numDigits

  // For a label positioned at distance D from center, with text box of width W and height H,
  // the nearest edge can be as close as D - sqrt((W/2)² + (H/2)²) in worst case (diagonal)
  // We want this to be just outside the circle
  const halfWidth = textWidthMeters / 2
  const halfHeight = textHeightMeters / 2
  const diagonalHalf = Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight)

  // Add small margin for safety
  const margin = 8 // 8 meter margin

  return circleRadius + margin + diagonalHalf
}

/**
 * Try to find a non-overlapping position for a label
 */
function findNonOverlappingPosition(
  currentPos: Position,
  prevPos: Position | null,
  nextPos: Position | null,
  transform: CoordinateTransform,
  existingLabelPositions: [number, number][],
  controlNumber: number,
  finishPosition: Position | null,
  startPosition: Position | null
): [number, number] {
  const coords = transform(currentPos)
  const offsetDistance = calculateLabelOffset(controlNumber)
  const minLabelDistance = 50 // minimum distance between labels in meters
  const finishOuterRadius = 45 // Finish marker outer circle radius in meters
  const finishMargin = 10 // Extra margin around finish marker
  const startRadius = 52 // Start triangle extends ~52m from center (90m side / sqrt(3))
  const startMargin = 10 // Extra margin around start marker

  // Calculate preferred angle based on course direction
  let preferredAngle = 45 // default to northeast

  if (prevPos && nextPos) {
    // Between two controls - position on side with larger angle
    const bearingFrom = calculateBearing(prevPos, currentPos)
    const bearingTo = calculateBearing(currentPos, nextPos)

    // Calculate turn angle (how much we turn from entry to exit)
    const turnAngle = (bearingTo - bearingFrom + 360) % 360

    // Calculate proper average of the two bearings
    const avgBearing = averageAngles(bearingFrom, bearingTo)

    // Place label on the side with the larger angle
    // If turn < 180°, the larger angle is on the opposite side of the turn
    // If turn >= 180°, the larger angle is on the same side as the turn
    preferredAngle = turnAngle < 180 ? avgBearing - 90 : avgBearing + 90
  } else if (prevPos) {
    // Last control - position perpendicular to incoming bearing
    const bearingFrom = calculateBearing(prevPos, currentPos)
    preferredAngle = bearingFrom + 90
  } else if (nextPos) {
    // First control - position perpendicular to outgoing bearing
    const bearingTo = calculateBearing(currentPos, nextPos)
    preferredAngle = bearingTo + 90
  }

  // Try preferred angle first, then try alternatives if there's overlap
  const anglesToTry = [
    preferredAngle,
    preferredAngle + 180, // opposite side
    preferredAngle + 90,  // perpendicular
    preferredAngle - 90,  // other perpendicular
    preferredAngle + 45,  // diagonal variations
    preferredAngle - 45,
    preferredAngle + 135,
    preferredAngle - 135,
  ]

  const lat = currentPos.lat
  const metersPerDegreeLat = 111320
  const metersPerDegreeLng = 111320 * Math.cos(lat * Math.PI / 180)

  for (const angle of anglesToTry) {
    const labelRad = angle * Math.PI / 180
    const labelLat = coords[0] + (offsetDistance * Math.cos(labelRad)) / metersPerDegreeLat
    const labelLng = coords[1] + (offsetDistance * Math.sin(labelRad)) / metersPerDegreeLng
    const labelPos: [number, number] = [labelLat, labelLng]

    // Check if this position overlaps with any existing labels
    let hasOverlap = false
    for (const existingPos of existingLabelPositions) {
      if (calculateDistance(labelPos, existingPos) < minLabelDistance) {
        hasOverlap = true
        break
      }
    }

    // Check if this position overlaps with the finish marker
    if (!hasOverlap && finishPosition) {
      const finishCoords = transform(finishPosition)
      if (calculateDistance(labelPos, finishCoords) < finishOuterRadius + finishMargin) {
        hasOverlap = true
      }
    }

    // Check if this position overlaps with the start marker
    if (!hasOverlap && startPosition) {
      const startCoords = transform(startPosition)
      if (calculateDistance(labelPos, startCoords) < startRadius + startMargin) {
        hasOverlap = true
      }
    }

    if (!hasOverlap) {
      return labelPos
    }
  }

  // If all positions have overlap, return the preferred angle position anyway
  const labelRad = preferredAngle * Math.PI / 180
  const labelLat = coords[0] + (offsetDistance * Math.cos(labelRad)) / metersPerDegreeLat
  const labelLng = coords[1] + (offsetDistance * Math.sin(labelRad)) / metersPerDegreeLng
  return [labelLat, labelLng]
}

/**
 * Create a control number label as a DivIcon
 */
function createControlNumberLabel(
  position: [number, number],
  number: number,
  fontSize: number
): L.Marker {
  const icon = L.divIcon({
    className: 'control-number-label',
    html: `<div style="
      background-color: transparent;
      color: #9333ea;
      font-weight: bold;
      font-size: ${fontSize}px;
      white-space: nowrap;
      line-height: 1;
    ">${number}</div>`,
    iconSize: [fontSize * 1.5, fontSize * 1.5],
    iconAnchor: [fontSize * 0.75, fontSize * 0.75] // Center the icon
  })

  return L.marker(position, { icon, interactive: false })
}

/**
 * Create a layer group for all unique controls (always visible)
 */
export function createControlsLayer(
  uniqueControls: UniqueControl[],
  transform: CoordinateTransform = pos => [pos.lat, pos.lng],
  zoom: number = 15,
  isControlVisited: (controlIds: string[]) => boolean = () => false
): L.LayerGroup {
  const layerGroup = L.layerGroup()

  uniqueControls.forEach(uniqueControl => {
    const visited = isControlVisited(uniqueControl.controlIds)
    const marker = createControlMarker(uniqueControl, transform, zoom, visited)
    marker.addTo(layerGroup)
  })

  return layerGroup
}

/**
 * Create a layer group for unique starts and finishes (for "All Controls" view)
 * All start triangles point north (upward)
 */
export function createUniqueStartsFinishesLayer(
  courses: Course[],
  transform: CoordinateTransform = pos => [pos.lat, pos.lng],
  zoom: number = 15
): L.LayerGroup {
  const layerGroup = L.layerGroup()

  // Extract unique starts
  const uniqueStarts = extractUniqueStarts(courses)
  uniqueStarts.forEach(uniqueStart => {
    // Create start marker pointing north (no rotation)
    const startMarker = createStartMarker(
      uniqueStart.position,
      null, // null = point north
      uniqueStart.courseNames.join(', '),
      transform,
      zoom
    )
    startMarker.addTo(layerGroup)
  })

  // Extract unique finishes
  const uniqueFinishes = extractUniqueFinishes(courses)
  uniqueFinishes.forEach(uniqueFinish => {
    const finishMarker = createFinishMarker(
      uniqueFinish.position,
      uniqueFinish.courseNames.join(', '),
      transform,
      zoom
    )
    finishMarker.addTo(layerGroup)
  })

  return layerGroup
}

/**
 * Create a layer group for controls with numbers (for single course view)
 */
export function createNumberedControlsLayer(
  course: Course,
  allCourses: Course[],
  transform: CoordinateTransform = pos => [pos.lat, pos.lng],
  zoom: number = 15,
  isControlVisited: (controlId: string) => boolean = () => false
): L.LayerGroup {
  const layerGroup = L.layerGroup()
  const labelPositions: [number, number][] = []
  const fontSize = calculateFontSize(zoom)

  course.controls.forEach((control, index) => {
    // Create control circle
    const visited = isControlVisited(control.id)
    const coords = transform(control.position)
    const circle = L.circle(coords, {
      radius: 37.5,
      fillColor: 'transparent',
      fillOpacity: 0,
      color: visited ? '#22c55e' : '#9333ea',
      weight: calculateLineWidth(zoom),
      interactive: true,
    })

    // Find all courses that visit this control (matching by position and code)
    const coursesAtThisControl: Array<{ courseName: string; controlNumber: number }> = []
    allCourses.forEach(c => {
      c.controls.forEach(ctrl => {
        if (ctrl.code === control.code &&
            ctrl.position.lat === control.position.lat &&
            ctrl.position.lng === control.position.lng) {
          coursesAtThisControl.push({
            courseName: c.name,
            controlNumber: ctrl.number
          })
        }
      })
    })

    // Build popup with all courses
    const coursesList = coursesAtThisControl
      .map(c => `
        <div style="margin: 4px 0;">
          <span style="font-size: 12px;">${c.courseName} - Control ${c.controlNumber}</span>
        </div>
      `)
      .join('')

    const popupContent = `
      <div style="font-family: Arial, sans-serif; min-width: 180px;">
        <div style="font-weight: bold; margin-bottom: 8px;">Control ${control.code}</div>
        <div style="font-size: 11px; color: #666; margin-bottom: 6px;">Courses:</div>
        ${coursesList}
      </div>
    `
    circle.bindPopup(popupContent, { closeButton: true, minWidth: 180 })
    circle.addTo(layerGroup)

    // Create control number label with collision avoidance
    const prevControl = index > 0 ? course.controls[index - 1] : null
    const nextControl = index < course.controls.length - 1 ? course.controls[index + 1] : null

    const labelPos = findNonOverlappingPosition(
      control.position,
      prevControl?.position || null,
      nextControl?.position || null,
      transform,
      labelPositions,
      control.number,
      course.finish,
      course.start
    )

    labelPositions.push(labelPos)

    const label = createControlNumberLabel(labelPos, control.number, fontSize)
    label.addTo(layerGroup)
  })

  return layerGroup
}
