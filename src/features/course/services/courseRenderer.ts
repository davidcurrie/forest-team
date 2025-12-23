import L from 'leaflet'
import { Course, Control, Position } from '../../../shared/types'

/**
 * Create a start marker (triangle)
 */
export function createStartMarker(position: Position, color: string, courseName: string): L.Marker {
  const icon = L.divIcon({
    className: 'orienteering-start-marker',
    html: `
      <svg width="30" height="30" viewBox="0 0 30 30">
        <polygon points="15,5 25,25 5,25" fill="${color}" stroke="white" stroke-width="2"/>
      </svg>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })

  const marker = L.marker([position.lat, position.lng], { icon })

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
 * Create a control marker (circle with number)
 */
export function createControlMarker(
  control: Control,
  position: Position,
  color: string,
  courseName: string
): L.Marker {
  const icon = L.divIcon({
    className: 'orienteering-control-marker',
    html: `
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="12" fill="white" stroke="${color}" stroke-width="3"/>
        <text x="20" y="20" text-anchor="middle" dominant-baseline="central"
              font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="${color}">
          ${control.number}
        </text>
      </svg>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })

  const marker = L.marker([position.lat, position.lng], { icon })

  // Add popup with control information
  const popupContent = `
    <div style="font-family: Arial, sans-serif; min-width: 120px;">
      <div style="font-weight: bold; margin-bottom: 4px;">Control ${control.number}</div>
      <div style="font-size: 12px; color: #666;">Code: ${control.code}</div>
      <div style="font-size: 12px; color: #666; margin-top: 4px;">Course: ${courseName}</div>
    </div>
  `
  marker.bindPopup(popupContent, {
    closeButton: true,
    minWidth: 120,
  })

  return marker
}

/**
 * Create a finish marker (double circle)
 */
export function createFinishMarker(position: Position, color: string, courseName: string): L.Marker {
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

  const marker = L.marker([position.lat, position.lng], { icon })

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
 * Create a polyline connecting course controls
 */
export function createCoursePolyline(course: Course): L.Polyline {
  const positions: L.LatLngExpression[] = [
    [course.start.lat, course.start.lng],
    ...course.controls.map(c => [c.position.lat, c.position.lng] as L.LatLngExpression),
    [course.finish.lat, course.finish.lng],
  ]

  return L.polyline(positions, {
    color: course.color,
    weight: 3,
    opacity: 0.7,
    lineJoin: 'round',
    lineCap: 'round',
  })
}

/**
 * Render a course on the map
 */
export function renderCourse(map: L.Map, course: Course): L.LayerGroup {
  const layerGroup = L.layerGroup()

  // Add course line
  const polyline = createCoursePolyline(course)
  polyline.addTo(layerGroup)

  // Add start marker
  const startMarker = createStartMarker(course.start, course.color, course.name)
  startMarker.addTo(layerGroup)

  // Add control markers
  course.controls.forEach(control => {
    const marker = createControlMarker(control, control.position, course.color, course.name)
    marker.addTo(layerGroup)
  })

  // Add finish marker
  const finishMarker = createFinishMarker(course.finish, course.color, course.name)
  finishMarker.addTo(layerGroup)

  // Add to map
  layerGroup.addTo(map)

  return layerGroup
}
