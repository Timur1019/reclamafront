<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import BusMap from '@/components/map/BusMap.vue'
import YandexMapView from '@/components/map/YandexMapView.vue'
import AdSlide from '@/components/ads/AdSlide.vue'
import BusFleetPanel from '@/components/fleet/BusFleetPanel.vue'
import { usePositionsStore } from '@/stores/positions'
import { useStompPositions } from '@/composables/useStompPositions'
import { usePlaylistEngine } from '@/composables/usePlaylistEngine'
import { buildScreenSegments } from '@/composables/buildScreenSegments'
import { fetchScreenPlaylist } from '@/services/api/playlistApi'
import { fetchActiveStops } from '@/services/api/stopsApi'
import { parseCoord } from '@/utils/coords'
import type { PlaylistSegment } from '@/types/playlist'

const MAP_PROVIDER = (import.meta.env.VITE_MAP_PROVIDER ?? 'yandex').toLowerCase()
const mapIsLeaflet = MAP_PROVIDER === 'leaflet'
const MAP_BLOCK_MS = Math.max(5000, Number(import.meta.env.VITE_MAP_BLOCK_SECONDS ?? 22) * 1000)

const route = useRoute()
const stopCode = computed(() => {
  const q = route.query.stop
  return typeof q === 'string' && q.length > 0 ? q : null
})

const segmentsRef = ref<PlaylistSegment[]>([{ kind: 'map', durationMs: MAP_BLOCK_MS }])
const playlist = usePlaylistEngine(segmentsRef)
const positions = usePositionsStore()
/** Координаты остановки из справочника для оценки прибытия */
const stopTarget = ref<{ lat: number; lng: number } | null>(null)

const showMap = computed(() => playlist.current.value.kind === 'map')
const showAd = computed(() => playlist.current.value.kind === 'ad')
const adSegment = computed(() => (playlist.current.value.kind === 'ad' ? playlist.current.value : null))

const progressPct = computed(() => {
  const cur = playlist.current.value
  if (cur.durationMs <= 0) {
    return 0
  }
  return Math.min(100, Math.round(((cur.durationMs - playlist.remainingMs.value) / cur.durationMs) * 100))
})

async function refreshPlaylist() {
  try {
    const items = await fetchScreenPlaylist()
    segmentsRef.value = buildScreenSegments(items, MAP_BLOCK_MS)
  } catch {
    segmentsRef.value = [{ kind: 'map', durationMs: Math.max(MAP_BLOCK_MS, 60_000) }]
  }
}

let playlistPoll: ReturnType<typeof setInterval> | null = null
let stopPoll: ReturnType<typeof setInterval> | null = null

watch(
  stopCode,
  async (code) => {
    void positions.loadScreen(code)
    if (stopPoll) {
      clearInterval(stopPoll)
      stopPoll = null
    }
    if (code) {
      stopPoll = setInterval(() => void positions.loadScreen(code), 35_000)
    }

    const trimmed = code?.trim()
    if (!trimmed) {
      stopTarget.value = null
      return
    }
    try {
      const list = await fetchActiveStops()
      const upper = trimmed.toUpperCase()
      const s = list.find((x) => x.code.toUpperCase() === upper)
      if (s) {
        const lat = parseCoord(s.latitude)
        const lng = parseCoord(s.longitude)
        stopTarget.value = { lat, lng }
      } else {
        stopTarget.value = null
      }
    } catch {
      stopTarget.value = null
    }
  },
  { immediate: true },
)

useStompPositions()

onMounted(() => {
  void refreshPlaylist()
  playlistPoll = setInterval(() => void refreshPlaylist(), 120_000)
})

onUnmounted(() => {
  if (playlistPoll) {
    clearInterval(playlistPoll)
  }
  if (stopPoll) {
    clearInterval(stopPoll)
  }
})
</script>

<template>
  <div class="screen-page">
    <header class="screen-page__header">
      <div class="screen-page__brand">SmartStop · Самарканд</div>
      <div class="screen-page__actions">
        <RouterLink class="screen-page__admin-link" to="/admin/ads">Админ: реклама</RouterLink>
        <div v-if="stopCode" class="screen-page__stop">Остановка: <strong>{{ stopCode }}</strong></div>
      </div>
      <div v-if="positions.error" class="screen-page__alert screen-page__alert--error" role="alert">
        {{ positions.error }}
      </div>
      <div v-else-if="positions.loading" class="screen-page__alert">Загрузка…</div>
    </header>

    <main class="screen-page__stage">
      <Transition name="screen-page__fade">
        <div v-show="showMap" class="screen-page__pane screen-page__pane--map">
          <div class="screen-page__map-layout">
            <YandexMapView v-if="!mapIsLeaflet" class="screen-page__map-main" />
            <BusMap v-else class="screen-page__map-main" :positions="positions.list" />
            <BusFleetPanel
              :positions="positions.list"
              :stop-target="stopTarget"
              :stop-code="stopCode"
            />
          </div>
        </div>
      </Transition>
      <Transition name="screen-page__fade">
        <div
          v-show="showAd && adSegment"
          class="screen-page__pane screen-page__pane--ad screen-page__pane--ad-fullscreen"
        >
          <AdSlide
            v-if="adSegment"
            :title="adSegment.title"
            :media="adSegment.media"
            :active="showAd"
            fullscreen
          />
          <div class="screen-page__ad-progress" :style="{ '--p': progressPct + '%' }" aria-hidden="true" />
        </div>
      </Transition>
    </main>

    <footer class="screen-page__footer">
      <div class="screen-page__progress" :style="{ '--p': progressPct + '%' }" />
      <div class="screen-page__meta">
        {{ showMap ? 'Карта' : 'Реклама' }}
        · ТС: {{ positions.list.length }}
        <span v-if="!mapIsLeaflet" class="screen-page__hint">
          · Яндекс: только фоновая карта, маркеры ТС не рисуются. Маркеры — при
          <code>VITE_MAP_PROVIDER=leaflet</code>
        </span>
      </div>
    </footer>
  </div>
</template>
