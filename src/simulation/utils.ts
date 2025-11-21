import type { GroundStation, Satellite } from './types'

const earthRadius = 6371

export const degToRad = (deg: number) => (deg * Math.PI) / 180
export const radToDeg = (rad: number) => (rad * 180) / Math.PI

export const wrapDegrees = (deg: number) => {
  let out = deg % 360
  if (out < -180) out += 360
  if (out > 180) out -= 360
  return out
}

export const greatCircleDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const dLat = degToRad(lat2 - lat1)
  const dLon = degToRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadius * c
}

export const nearestGroundStation = (sat: Satellite, stations: GroundStation[]) => {
  let min = Number.POSITIVE_INFINITY
  let closest: GroundStation | null = null
  for (const station of stations) {
    const dist = greatCircleDistance(
      sat.position.lat,
      sat.position.lon,
      station.coordinates.lat,
      station.coordinates.lon,
    )
    if (dist < min) {
      min = dist
      closest = station
    }
  }
  return { station: closest, distance: min }
}

export const positionToVector3 = (lat: number, lon: number, altKm: number) => {
  const radius = 1 + altKm / 6371
  const phi = degToRad(90 - lat)
  const theta = degToRad(lon + 180)
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)
  return { x, y, z }
}

export const zoneForLat = (lat: number) => {
  if (lat > 30) return 'americas'
  if (lat < -10) return 'apac'
  return 'emea'
}
