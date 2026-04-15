export function normalizeMediaUrl(raw: string): string {
  const s = String(raw ?? '').trim()
  if (!s) return s

  // Protocol-relative URLs: //cdn.example.com/x.mp4
  if (s.startsWith('//')) {
    const proto = typeof window !== 'undefined' ? window.location.protocol : 'https:'
    return `${proto}${s}`
  }

  // If page is https and media is http → browsers block it (mixed content).
  // Try upgrading to https (works for many CDNs); otherwise leave as-is.
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && s.startsWith('http://')) {
    return `https://${s.slice('http://'.length)}`
  }

  return s
}

function pickQueryParam(url: URL, name: string): string | null {
  const v = url.searchParams.get(name)
  return v && v.trim().length > 0 ? v.trim() : null
}

export function toYoutubeEmbedUrl(raw: string): string | null {
  const s = String(raw ?? '').trim()
  if (!s) return null
  try {
    const u = new URL(s.startsWith('//') ? `https:${s}` : s)
    const host = u.hostname.toLowerCase()
    let id: string | null = null

    if (host === 'youtu.be') {
      id = u.pathname.replace(/^\//, '').split('/')[0] ?? null
    } else if (host.endsWith('youtube.com')) {
      if (u.pathname === '/watch') {
        id = pickQueryParam(u, 'v')
      } else if (u.pathname.startsWith('/shorts/')) {
        id = u.pathname.split('/')[2] ?? null
      } else if (u.pathname.startsWith('/embed/')) {
        id = u.pathname.split('/')[2] ?? null
      }
    }

    if (!id) return null
    id = id.replace(/[^a-zA-Z0-9_-]/g, '')
    if (!id) return null

    // kiosk params: autoplay + mute (to allow autoplay), loop via playlist=id
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&mute=1&controls=0&rel=0&playsinline=1&loop=1&playlist=${encodeURIComponent(id)}`
  } catch {
    return null
  }
}

