export type AdMedia =
  | { type: 'image'; src: string }
  | { type: 'video'; src: string; poster?: string }
  | { type: 'youtube'; src: string }

export type PlaylistSegment =
  | { kind: 'map'; durationMs: number }
  | { kind: 'ad'; durationMs: number; title: string; media: AdMedia }

/** Элемент с backend GET /api/v1/screen/playlist */
export interface PlaylistItemApi {
  title: string
  mediaType: string
  mediaUrl: string
  durationSeconds: number
}
