import type { BusPosition } from '@/types/position'
import { DEMO_ROUTE_SMR, type LatLng } from '@/mock/demoRoute'

type DemoBusSpec = {
  busId: string
  plateNumber: string
  routeCode: string
  color: string
  /** Смещение (сек) относительно начала цикла */
  offsetSec: number
  /** Период полного круга (сек) */
  loopSec: number
}

export const DEMO_BUSES: DemoBusSpec[] = [
  { busId: 'demo-9', plateNumber: 'UZ 009 AAA', routeCode: '9', color: '#3d8bfd', offsetSec: 0, loopSec: 240 },
  { busId: 'demo-34', plateNumber: 'UZ 034 BBB', routeCode: '34', color: '#20c997', offsetSec: 35, loopSec: 260 },
  { busId: 'demo-55', plateNumber: 'UZ 055 CCC', routeCode: '55', color: '#fd7e14', offsetSec: 70, loopSec: 280 },
  { busId: 'demo-44', plateNumber: 'UZ 044 DDD', routeCode: '44', color: '#6f42c1', offsetSec: 110, loopSec: 250 },
  { busId: 'demo-77', plateNumber: 'UZ 077 EEE', routeCode: '77', color: '#dc3545', offsetSec: 160, loopSec: 300 },
]

function toRad(x: number): number {
  return (x * Math.PI) / 180
}

function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371_000
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lng - a.lng)
  const s1 = Math.sin(dLat / 2)
  const s2 = Math.sin(dLon / 2)
  const q = s1 * s1 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * s2 * s2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(q)))
}

type RouteMeasure = {
  points: LatLng[]
  segMeters: number[]
  totalMeters: number
}

function measureRoute(points: LatLng[]): RouteMeasure {
  const segMeters: number[] = []
  let totalMeters = 0
  for (let i = 1; i < points.length; i++) {
    const d = haversineMeters(points[i - 1]!, points[i]!)
    segMeters.push(d)
    totalMeters += d
  }
  return { points, segMeters, totalMeters }
}

const ROUTE = measureRoute(DEMO_ROUTE_SMR)

function interpolateOnRoute(metersFromStart: number): { pos: LatLng; headingDeg: number } {
  const t = ((metersFromStart % ROUTE.totalMeters) + ROUTE.totalMeters) % ROUTE.totalMeters
  let acc = 0
  for (let i = 0; i < ROUTE.segMeters.length; i++) {
    const seg = ROUTE.segMeters[i]!
    if (acc + seg >= t) {
      const a = ROUTE.points[i]!
      const b = ROUTE.points[i + 1]!
      const k = seg <= 0 ? 0 : (t - acc) / seg
      const lat = a.lat + (b.lat - a.lat) * k
      const lng = a.lng + (b.lng - a.lng) * k
      const headingDeg = bearingDeg(a, b)
      return { pos: { lat, lng }, headingDeg }
    }
    acc += seg
  }
  const last = ROUTE.points[ROUTE.points.length - 1]!
  const prev = ROUTE.points[Math.max(0, ROUTE.points.length - 2)]!
  return { pos: last, headingDeg: bearingDeg(prev, last) }
}

function bearingDeg(a: LatLng, b: LatLng): number {
  const φ1 = toRad(a.lat)
  const φ2 = toRad(b.lat)
  const λ1 = toRad(a.lng)
  const λ2 = toRad(b.lng)
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1)
  const θ = Math.atan2(y, x)
  const deg = ((θ * 180) / Math.PI + 360) % 360
  return deg
}

export function demoRoutePolyline(): LatLng[] {
  return DEMO_ROUTE_SMR
}

export function demoPositionsNow(nowMs: number = Date.now()): BusPosition[] {
  const nowIso = new Date(nowMs).toISOString()
  return DEMO_BUSES.map((b) => {
    const tSec = nowMs / 1000
    const progress = ((tSec + b.offsetSec) % b.loopSec) / b.loopSec
    const meters = progress * ROUTE.totalMeters
    const { pos, headingDeg } = interpolateOnRoute(meters)
    const speedMps = ROUTE.totalMeters / b.loopSec
    const speedKmh = Math.round(speedMps * 3.6)
    return {
      id: `${b.busId}:${Math.floor(nowMs / 1000)}`,
      busId: b.busId,
      plateNumber: b.plateNumber,
      routeId: null,
      routeCode: b.routeCode,
      latitude: pos.lat,
      longitude: pos.lng,
      speedKmh,
      headingDeg: Math.round(headingDeg),
      reportedAt: nowIso,
      receivedAt: nowIso,
    }
  })
}

