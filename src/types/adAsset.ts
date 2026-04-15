export interface AdAsset {
  id: string
  title: string
  mediaType: string
  mediaUrl: string
  durationSeconds: number
  enabled: boolean
  sortOrder: number
}

export interface AdAssetUpsert {
  title: string
  mediaType: string
  mediaUrl: string
  durationSeconds: number
  enabled: boolean
  sortOrder: number
}
