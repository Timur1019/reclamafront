import { SAMARKAND_MAX_BOUNDS } from '@/config/samarkand'

const [[south, west], [north, east]] = SAMARKAND_MAX_BOUNDS

export function isInsideSamarkand(lat: number, lng: number): boolean {
  return lat >= south && lat <= north && lng >= west && lng <= east
}

export function clampToSamarkand(lat: number, lng: number): [number, number] {
  return [Math.min(Math.max(lat, south), north), Math.min(Math.max(lng, west), east)]
}

const EARTH_RADIUS_KM = 6371

/** Расстояние по поверхности сферы (км), координаты в градусах WGS84 */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r1 = (lat1 * Math.PI) / 180
  const r2 = (lat2 * Math.PI) / 180
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(r1) * Math.cos(r2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)))
  return EARTH_RADIUS_KM * c
}
