/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  readonly VITE_WS_URL: string
  /** yandex | leaflet — по умолчанию yandex (виджет); маркеры GPS только в leaflet */
  readonly VITE_MAP_PROVIDER: string
  /** Длительность блока «карта» в плейлисте, секунды */
  readonly VITE_MAP_BLOCK_SECONDS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
