import { adminHttpClient } from '@/services/api/adminHttpClient'
import type { AdAsset, AdAssetUpsert } from '@/types/adAsset'

export async function adminListAds(): Promise<AdAsset[]> {
  const { data } = await adminHttpClient.get<AdAsset[]>('/api/v1/admin/ad-assets')
  return Array.isArray(data) ? data : []
}

export async function adminCreateAd(body: AdAssetUpsert): Promise<AdAsset> {
  const { data } = await adminHttpClient.post<AdAsset>('/api/v1/admin/ad-assets', body)
  return data
}

export async function adminUpdateAd(id: string, body: AdAssetUpsert): Promise<AdAsset> {
  const { data } = await adminHttpClient.put<AdAsset>(`/api/v1/admin/ad-assets/${id}`, body)
  return data
}

export async function adminDeleteAd(id: string): Promise<void> {
  await adminHttpClient.delete(`/api/v1/admin/ad-assets/${id}`)
}
