import type { PlaylistItemApi, PlaylistSegment } from '@/types/playlist'
import { normalizeMediaUrl, toYoutubeEmbedUrl } from '@/utils/mediaUrl'

export function buildScreenSegments(items: PlaylistItemApi[], mapBlockMs: number): PlaylistSegment[] {
  if (!items.length) {
    return [{ kind: 'map', durationMs: Math.max(mapBlockMs, 60_000) }]
  }
  const segs: PlaylistSegment[] = [{ kind: 'map', durationMs: mapBlockMs }]
  for (const it of items) {
    const ms = Math.max(1000, it.durationSeconds * 1000)
    const t = it.mediaType.toLowerCase()
    const src = normalizeMediaUrl(it.mediaUrl)
    const yt = toYoutubeEmbedUrl(src)
    if (yt) {
      segs.push({
        kind: 'ad',
        durationMs: ms,
        title: it.title,
        media: { type: 'youtube', src: yt },
      })
      continue
    }
    if (t === 'video') {
      segs.push({
        kind: 'ad',
        durationMs: ms,
        title: it.title,
        media: { type: 'video', src },
      })
    } else {
      segs.push({
        kind: 'ad',
        durationMs: ms,
        title: it.title,
        media: { type: 'image', src },
      })
    }
  }
  return segs
}
