/**
 * Coordinate utilities for geospatial calculations
 */

import type { Position } from '../types'

/**
 * Calculate the distance between two GPS coordinates using the Haversine formula
 * Returns distance in meters
 *
 * @param pos1 First position (lat, lng)
 * @param pos2 Second position (lat, lng)
 * @returns Distance in meters
 */
export function calculateDistance(pos1: Position, pos2: Position): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (pos1.lat * Math.PI) / 180
  const φ2 = (pos2.lat * Math.PI) / 180
  const Δφ = ((pos2.lat - pos1.lat) * Math.PI) / 180
  const Δλ = ((pos2.lng - pos1.lng) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Check if a position is within a certain distance of a target position
 *
 * @param position Current position
 * @param target Target position
 * @param threshold Distance threshold in meters
 * @returns True if within threshold distance
 */
export function isWithinDistance(
  position: Position,
  target: Position,
  threshold: number
): boolean {
  return calculateDistance(position, target) <= threshold
}
