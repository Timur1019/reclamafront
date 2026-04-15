import { httpClient } from '@/services/api/httpClient'
import type { BusPosition } from '@/types/position'
import type { StopSummary } from '@/types/stop'

export async function fetchActiveStops(): Promise<StopSummary[]> {
  const { data } = await httpClient.get<StopSummary[]>('/api/v1/stops')
  return Array.isArray(data) ? data : []
}

export async function fetchPositionsForStop(stopCode: string): Promise<BusPosition[]> {
  const { data } = await httpClient.get<BusPosition[]>(
    `/api/v1/stops/${encodeURIComponent(stopCode)}/vehicle-positions`,
  )
  return Array.isArray(data) ? data : []
}
