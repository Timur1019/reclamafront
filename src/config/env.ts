/**
 * Пустая строка — запросы на тот же origin (путь /api/...).
 * - dev: Vite proxy (vite.config) шлёт /api и /ws на localhost:8080.
 * - prod: задай VITE_API_BASE=https://публичный-бэкенд... или Rewrite /api/* на Render.
 * Если в .env стоит VITE_API_BASE=http://localhost:8080, оно игнорируется — иначе axios
 * обходит прокси и снова бьёт в localhost:8080 (частые 404).
 */
const rawViteApiBase = String(import.meta.env.VITE_API_BASE ?? '').trim()

function isLoopbackHttpUrl(value: string): boolean {
  if (!value) return false
  try {
    const h = new URL(value).hostname.toLowerCase()
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]'
  } catch {
    return false
  }
}

export const apiBase =
  !rawViteApiBase || isLoopbackHttpUrl(rawViteApiBase) ? '' : rawViteApiBase

if (import.meta.env.PROD && !apiBase) {
  console.warn(
    rawViteApiBase && isLoopbackHttpUrl(rawViteApiBase)
      ? '[SmartStop] VITE_API_BASE указывал на localhost — в проде это отключено, REST идёт на тот же домен (/api/...). Удали localhost из Render Environment или задай публичный URL бэкенда.'
      : '[SmartStop] VITE_API_BASE не задан: REST на тот же домен (/api/...). Добавь VITE_API_BASE (https://...) в Render или Rewrite /api/*.',
  )
}

function inferWsFromApiBase(): string | null {
  if (!rawViteApiBase || isLoopbackHttpUrl(rawViteApiBase)) {
    return null
  }
  try {
    const u = new URL(rawViteApiBase)
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

/** Демо-режим (без backend): генерация маршрута и движения автобусов на фронте. */
export const demoMode = String(import.meta.env.VITE_DEMO_MODE ?? '').trim() === '1'
