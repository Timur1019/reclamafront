<script setup lang="ts">
import { onMounted, onUnmounted, watch, ref, shallowRef, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { BusPosition } from '@/types/position'
import { SAMARKAND_CENTER, SAMARKAND_MAX_BOUNDS, SAMARKAND_CITY_POLYGON } from '@/config/samarkand'
import { isInsideSamarkand } from '@/utils/geo'
import { parseCoord } from '@/utils/coords'

const props = defineProps<{
  positions: BusPosition[]
  routePath?: { lat: number; lng: number }[] | null
}>()

const el = ref<HTMLElement | null>(null)
const map = shallowRef<L.Map | null>(null)
const layer = shallowRef<L.LayerGroup | null>(null)
const routeLayer = shallowRef<L.Polyline | null>(null)
let resizeObs: ResizeObserver | null = null

const DEFAULT_ZOOM = 12

function visiblePositions(): BusPosition[] {
  return props.positions.filter((p) =>
    isInsideSamarkand(parseCoord(p.latitude), parseCoord(p.longitude)),
  )
}

function buildMarkers(positions: BusPosition[]): L.Marker[] {
  return positions.map((p) => {
    const lat = parseCoord(p.latitude)
    const lng = parseCoord(p.longitude)
    const route = p.routeCode ? String(p.routeCode) : ''
    const plateTail = p.plateNumber.replace(/\s+/g, ' ').trim().slice(-3)
    const icon = L.divIcon({
      className: 'bus-map__marker',
      html: `<span class="bus-map__marker-inner" data-route="${escapeHtml(route)}">
        <span class="bus-map__marker-route">${escapeHtml(route || '—')}</span>
        <span class="bus-map__marker-plate">${escapeHtml(plateTail)}</span>
      </span>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    })
    return L.marker([lat, lng], { icon, title: p.plateNumber })
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function redraw() {
  if (!map.value || !layer.value) {
    return
  }
  layer.value.clearLayers()
  const vis = visiblePositions()
  for (const m of buildMarkers(vis)) {
    layer.value.addLayer(m)
  }
  if (vis.length === 1) {
    const p = vis[0]!
    map.value.setView([parseCoord(p.latitude), parseCoord(p.longitude)], 14, { animate: true })
  } else if (vis.length > 1) {
    const bounds = L.latLngBounds(
      vis.map((p) => [parseCoord(p.latitude), parseCoord(p.longitude)] as L.LatLngExpression),
    )
    map.value.fitBounds(bounds.pad(0.12), { maxZoom: 15, animate: true })
  } else {
    map.value.setView(SAMARKAND_CENTER, DEFAULT_ZOOM, { animate: true })
  }
}

onMounted(() => {
  if (!el.value) {
    return
  }
  const m = L.map(el.value, {
    zoomControl: true,
    attributionControl: true,
    maxBounds: SAMARKAND_MAX_BOUNDS,
    maxBoundsViscosity: 0.85,
  })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(m)
  L.polygon(SAMARKAND_CITY_POLYGON, {
    color: '#3d8bfd',
    weight: 2,
    fillColor: '#1e3a5f',
    fillOpacity: 0.12,
  }).addTo(m)
  const g = L.layerGroup().addTo(m)
  m.setView(SAMARKAND_CENTER, DEFAULT_ZOOM)
  map.value = m
  layer.value = g
  if (props.routePath && props.routePath.length >= 2) {
    routeLayer.value = L.polyline(
      props.routePath.map((p) => [p.lat, p.lng] as L.LatLngExpression),
      { color: '#0d6efd', weight: 4, opacity: 0.85 },
    ).addTo(m)
  }
  redraw()

  void nextTick(() => {
    m.invalidateSize()
  })
  resizeObs = new ResizeObserver(() => {
    map.value?.invalidateSize()
  })
  resizeObs.observe(el.value)
})

watch(
  () => props.positions,
  () => redraw(),
  { deep: true },
)

watch(
  () => props.routePath,
  (path) => {
    if (!map.value) return
    routeLayer.value?.remove()
    routeLayer.value = null
    if (path && path.length >= 2) {
      routeLayer.value = L.polyline(
        path.map((p) => [p.lat, p.lng] as L.LatLngExpression),
        { color: '#0d6efd', weight: 4, opacity: 0.85 },
      ).addTo(map.value)
    }
  },
  { deep: true },
)

onUnmounted(() => {
  resizeObs?.disconnect()
  resizeObs = null
  map.value?.remove()
  map.value = null
  layer.value = null
  routeLayer.value = null
})
</script>

<template>
  <div ref="el" class="bus-map" role="application" aria-label="Карта автобусов, Самарканд" />
</template>
