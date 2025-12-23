import JSZip from 'jszip'
import { XMLParser } from 'fast-xml-parser'
import { GeoReference, LatLngBounds } from '../../../shared/types'
import { ParsedMapData } from './mapProcessor'

interface KMLGroundOverlay {
  '@_id'?: string
  name?: string
  LatLonBox: {
    north: number
    south: number
    east: number
    west: number
    rotation?: number
  }
  Icon: {
    href: string
  }
}

interface TileInfo {
  x: number
  y: number
  overlay: KMLGroundOverlay
  imageBlob: Blob
  width: number
  height: number
}

/**
 * Ensure value is an array
 */
function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

/**
 * Parse KML to extract ground overlay information (supports multiple overlays)
 */
function parseKML(kmlContent: string): KMLGroundOverlay[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  })

  const kmlData = parser.parse(kmlContent)

  // Navigate KML structure to find GroundOverlay elements
  const kml = kmlData.kml || kmlData
  const folder = kml.Folder || kml.Document || kml
  const groundOverlays = ensureArray(folder.GroundOverlay)

  if (groundOverlays.length === 0) {
    throw new Error('No GroundOverlay found in KML file')
  }

  return groundOverlays.map(overlay => {
    if (!overlay.LatLonBox) {
      throw new Error('GroundOverlay missing LatLonBox')
    }
    if (!overlay.Icon?.href) {
      throw new Error('GroundOverlay missing Icon/href')
    }

    return {
      '@_id': overlay['@_id'],
      name: overlay.name,
      LatLonBox: {
        north: parseFloat(overlay.LatLonBox.north),
        south: parseFloat(overlay.LatLonBox.south),
        east: parseFloat(overlay.LatLonBox.east),
        west: parseFloat(overlay.LatLonBox.west),
        rotation: overlay.LatLonBox.rotation ? parseFloat(overlay.LatLonBox.rotation) : 0,
      },
      Icon: {
        href: overlay.Icon.href,
      },
    }
  })
}

/**
 * Extract tile coordinates from filename (e.g., "tile_2_3.jpg" -> {x: 2, y: 3})
 */
function extractTileCoords(filename: string): { x: number; y: number } | null {
  const match = filename.match(/tile_(\d+)_(\d+)/)
  if (match) {
    return { x: parseInt(match[1]), y: parseInt(match[2]) }
  }
  return null
}

/**
 * Get image dimensions from Blob
 */
function getImageDimensionsFromBlob(blob: Blob): Promise<{ width: number; height: number }> {
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

/**
 * Load image from Blob
 */
function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Stitch multiple tiles into a single image
 */
async function stitchTiles(tiles: TileInfo[]): Promise<Blob> {
  // Determine grid dimensions
  const maxX = Math.max(...tiles.map(t => t.x))
  const maxY = Math.max(...tiles.map(t => t.y))
  const gridWidth = maxX + 1
  const gridHeight = maxY + 1

  // Assuming all tiles are the same size, use first tile dimensions
  const tileWidth = tiles[0].width
  const tileHeight = tiles[0].height

  const canvasWidth = gridWidth * tileWidth
  const canvasHeight = gridHeight * tileHeight

  // Create canvas
  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')!

  // Load and draw all tiles
  // Note: Invert Y-axis because tile coordinates use geographic convention
  // (Y=0 at bottom/south) but canvas has Y=0 at top
  for (const tile of tiles) {
    const img = await loadImage(tile.imageBlob)
    const x = tile.x * tileWidth
    const y = (maxY - tile.y) * tileHeight // Invert Y-axis
    ctx.drawImage(img, x, y, tileWidth, tileHeight)
  }

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to create blob from canvas'))
      }
    }, 'image/jpeg', 0.95)
  })
}

/**
 * Calculate overall bounds from multiple tile bounds
 */
function calculateOverallBounds(overlays: KMLGroundOverlay[]): LatLngBounds {
  const north = Math.max(...overlays.map(o => o.LatLonBox.north))
  const south = Math.min(...overlays.map(o => o.LatLonBox.south))
  const east = Math.max(...overlays.map(o => o.LatLonBox.east))
  const west = Math.min(...overlays.map(o => o.LatLonBox.west))

  return { north, south, east, west }
}

/**
 * Convert overall bounds to GeoReference format
 */
function boundsToGeoRef(
  bounds: LatLngBounds,
  imageWidth: number,
  imageHeight: number
): GeoReference {
  const { north, south, east, west } = bounds

  // Calculate pixel sizes
  const pixelSizeX = (east - west) / imageWidth
  const pixelSizeY = (south - north) / imageHeight // Negative because Y increases downward

  return {
    type: 'kmz',
    pixelSizeX,
    pixelSizeY,
    rotationX: 0,
    rotationY: 0,
    topLeftX: west,
    topLeftY: north,
  }
}

/**
 * Process KMZ file (supports single image or tiled images)
 */
export async function processKmzFile(kmzFile: File): Promise<ParsedMapData> {
  // Unzip KMZ
  const zip = await JSZip.loadAsync(kmzFile)

  // Find KML file (usually doc.kml or similar)
  const kmlFile = Object.keys(zip.files).find(name => name.toLowerCase().endsWith('.kml'))
  if (!kmlFile) {
    throw new Error('No KML file found in KMZ archive')
  }

  // Read KML content
  const kmlContent = await zip.files[kmlFile].async('string')
  const groundOverlays = parseKML(kmlContent)

  // Single overlay case
  if (groundOverlays.length === 1) {
    const overlay = groundOverlays[0]
    const imageFile = zip.files[overlay.Icon.href]
    if (!imageFile) {
      throw new Error(`Image file "${overlay.Icon.href}" not found in KMZ archive`)
    }

    const imageBlob = await imageFile.async('blob')
    const { width, height } = await getImageDimensionsFromBlob(imageBlob)
    const georef = boundsToGeoRef(overlay.LatLonBox, width, height)

    return {
      imageBlob,
      georef,
      bounds: overlay.LatLonBox,
    }
  }

  // Multiple overlays (tiled) case
  const tiles: TileInfo[] = []

  for (const overlay of groundOverlays) {
    const imageFile = zip.files[overlay.Icon.href]
    if (!imageFile) {
      console.warn(`Image file "${overlay.Icon.href}" not found, skipping`)
      continue
    }

    const imageBlob = await imageFile.async('blob')
    const { width, height } = await getImageDimensionsFromBlob(imageBlob)

    // Extract tile coordinates from filename
    const coords = extractTileCoords(overlay.Icon.href)
    if (!coords) {
      console.warn(`Could not extract tile coordinates from "${overlay.Icon.href}", skipping`)
      continue
    }

    tiles.push({
      x: coords.x,
      y: coords.y,
      overlay,
      imageBlob,
      width,
      height,
    })
  }

  if (tiles.length === 0) {
    throw new Error('No valid tiles found in KMZ')
  }

  // Stitch tiles together
  const stitchedBlob = await stitchTiles(tiles)
  const { width, height } = await getImageDimensionsFromBlob(stitchedBlob)

  // Calculate overall bounds
  const bounds = calculateOverallBounds(groundOverlays)
  const georef = boundsToGeoRef(bounds, width, height)

  return {
    imageBlob: stitchedBlob,
    georef,
    bounds,
  }
}
