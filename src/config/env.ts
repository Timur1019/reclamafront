/**
 * Пустая строка — запросы на тот же origin (путь /api/...).
 * - dev: Vite proxy (vite.config) шлёт /api и /ws на localhost:8080.
 * - prod без VITE_API_BASE: задай на Render Static «Rewrite» /api/* → https://твой-бэкенд.onrender.com/api/*
 *   или задай VITE_API_BASE при сборке (прямой вызов бэкенда, нужен CORS).
 */
export const apiBase = String(import.meta.env.VITE_API_BASE ?? '').trim()

if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE) {
  console.warn(
    '[SmartStop] VITE_API_BASE не задан при сборке: REST идёт на этот же домен (/api/...). Либо добавь VITE_API_BASE в Render Environment и пересобери, либо настрой Rewrite /api/* на бэкенд.',
  )
}

function inferWsFromApiBase(): string | null {
  const raw = import.meta.env.VITE_API_BASE
  if (typeof raw !== 'string' || raw.length === 0) {
    return null
  }
  try {
    const u = new URL(raw)
    const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${wsProto}//${u.host}/ws`
  } catch {
    return null
  }
}

function sameOriginWsBrokerUrl(): string {
  const proto = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = typeof window !== 'undefined' ? window.location.host : 'localhost:5173'
  return `${proto}//${host}/ws`
}

/** STOMP: VITE_WS_URL, иначе из VITE_API_BASE, иначе тот же хост что у страницы (прокси / rewrite на /ws). */
export const wsBrokerUrl =
  import.meta.env.VITE_WS_URL ?? inferWsFromApiBase() ?? sameOriginWsBrokerUrl()
