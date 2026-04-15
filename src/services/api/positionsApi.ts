import { httpClient } from '@/services/api/httpClient'
import type { BusPosition } from '@/types/position'
import { demoMode } from '@/config/env'
import { demoPositionsNow } from '@/mock/demoPositions'

export async function fetchLatestPositions(): Promise<BusPosition[]> {
  if (demoMode) {
    return demoPositionsNow()
  }
  const { data } = await httpClient.get<BusPosition[]>('/api/vehicles/positions')
  return Array.isArray(data) ? data : []
}
