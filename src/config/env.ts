const dev = import.meta.env.DEV

/** В dev — пустая строка (прокси Vite); в prod — полный URL API (обязательно на Render Static Site) */
export const apiBase = import.meta.env.VITE_API_BASE ?? (dev ? '' : 'http://localhost:8080')

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

/** STOMP broker: dev — тот же хост что у страницы (прокси); prod — VITE_WS_URL или из VITE_API_BASE */
export const wsBrokerUrl =
  import.meta.env.VITE_WS_URL ??
  (dev
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
    : inferWsFromApiBase() ?? 'ws://localhost:8080/ws')
