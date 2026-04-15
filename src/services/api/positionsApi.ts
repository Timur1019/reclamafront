import { httpClient } from '@/services/api/httpClient'
import type { BusPosition } from '@/types/position'

export async function fetchLatestPositions(): Promise<BusPosition[]> {
  const { data } = await httpClient.get<BusPosition[]>('/api/vehicles/positions')
  return Array.isArray(data) ? data : []
}
