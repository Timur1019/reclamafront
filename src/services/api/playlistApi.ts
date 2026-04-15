import { httpClient } from '@/services/api/httpClient'
import type { PlaylistItemApi } from '@/types/playlist'

export async function fetchScreenPlaylist(): Promise<PlaylistItemApi[]> {
  const { data } = await httpClient.get<PlaylistItemApi[]>('/api/v1/screen/playlist')
  return Array.isArray(data) ? data : []
}
