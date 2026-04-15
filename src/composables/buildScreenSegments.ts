import type { PlaylistItemApi, PlaylistSegment } from '@/types/playlist'

export function buildScreenSegments(items: PlaylistItemApi[], mapBlockMs: number): PlaylistSegment[] {
  if (!items.length) {
    return [{ kind: 'map', durationMs: Math.max(mapBlockMs, 60_000) }]
  }
  const segs: PlaylistSegment[] = [{ kind: 'map', durationMs: mapBlockMs }]
  for (const it of items) {
    const ms = Math.max(1000, it.durationSeconds * 1000)
    const t = it.mediaType.toLowerCase()
    if (t === 'video') {
      segs.push({
        kind: 'ad',
        durationMs: ms,
        title: it.title,
        media: { type: 'video', src: it.mediaUrl },
      })
    } else {
      segs.push({
        kind: 'ad',
        durationMs: ms,
        title: it.title,
        media: { type: 'image', src: it.mediaUrl },
      })
    }
  }
  return segs
}
