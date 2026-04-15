import { httpClient } from '@/services/api/httpClient'
import type { BusPosition } from '@/types/position'
import type { StopSummary } from '@/types/stop'
import { demoMode } from '@/config/env'
import { demoPositionsNow } from '@/mock/demoPositions'

export async function fetchActiveStops(): Promise<StopSummary[]> {
  if (demoMode) {
    return [
      { id: 'demo-farhad', code: 'FARHAD', name: 'Фарҳод бозори', latitude: 39.655, longitude: 66.982 },
      { id: 'demo-registan', code: 'REGISTAN', name: 'Регистан', latitude: 39.654, longitude: 66.975 },
    ]
  }
  const { data } = await httpClient.get<StopSummary[]>('/api/v1/stops')
  return Array.isArray(data) ? data : []
}

export async function fetchPositionsForStop(stopCode: string): Promise<BusPosition[]> {
  if (demoMode) {
    const upper = stopCode.trim().toUpperCase()
    const all = demoPositionsNow()
    if (!upper) return all
    // Демо-фильтр: для FARHAD показываем все; для остальных — половину, чтобы было видно работу фильтра.
    if (upper === 'FARHAD') return all
    return all.filter((_, idx) => idx % 2 === 0)
  }
  const { data } = await httpClient.get<BusPosition[]>(
    `/api/v1/stops/${encodeURIComponent(stopCode)}/vehicle-positions`,
  )
  return Array.isArray(data) ? data : []
}
