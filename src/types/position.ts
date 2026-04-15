export interface BusPosition {
  id: string
  busId: string
  plateNumber: string
  routeId: string | null
  routeCode?: string | null
  latitude: number | string
  longitude: number | string
  speedKmh: number | string | null
  headingDeg: number | string | null
  reportedAt: string
  receivedAt: string
}
