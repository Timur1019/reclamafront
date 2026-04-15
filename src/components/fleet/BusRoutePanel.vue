<script setup lang="ts">
import { computed } from 'vue'
import type { BusPosition } from '@/types/position'
import { haversineKm } from '@/utils/geo'
import { parseCoord, parseOptionalNumber } from '@/utils/coords'

const props = defineProps<{
  positions: BusPosition[]
  stopTitle: string
  routeLabel: string
  stopTarget: { lat: number; lng: number }
}>()

type Row = {
  key: string
  route: string
  plate: string
  etaMin: number
  distKm: number
  speedKmh: number
}

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n))
}

function calcRow(p: BusPosition): Row {
  const lat = parseCoord(p.latitude)
  const lng = parseCoord(p.longitude)
  const distKm = haversineKm(lat, lng, props.stopTarget.lat, props.stopTarget.lng)
  const speedFromGps = parseOptionalNumber(p.speedKmh)
  const speedKmh = clamp(Math.round(Math.max(speedFromGps ?? 0, 22)), 10, 88)
  let etaMin = Math.round((distKm / speedKmh) * 60)
  if (!Number.isFinite(etaMin)) etaMin = 99
  etaMin = clamp(etaMin, 0, 99)
  return {
    key: p.busId,
    route: String(p.routeCode ?? '—'),
    plate: p.plateNumber,
    etaMin,
    distKm: Number(distKm.toFixed(1)),
    speedKmh,
  }
}

const rows = computed(() =>
  [...props.positions]
    .map(calcRow)
    .sort((a, b) => a.etaMin - b.etaMin)
    .slice(0, 8),
)

function badgeClass(min: number): string {
  if (min <= 3) return 'bus-route-panel__eta-badge--urgent'
  if (min <= 10) return 'bus-route-panel__eta-badge--soon'
  return 'bus-route-panel__eta-badge--ok'
}
</script>

<template>
  <aside class="bus-route-panel" aria-label="Маршруты на остановке">
    <div class="bus-route-panel__head">
      <div class="bus-route-panel__title">Остановка: {{ stopTitle }}</div>
      <div class="bus-route-panel__route">{{ routeLabel }}</div>
    </div>

    <div class="bus-route-panel__list">
      <div v-for="r in rows" :key="r.key" class="bus-route-panel__row">
        <div class="bus-route-panel__eta">
          <span class="bus-route-panel__eta-badge" :class="badgeClass(r.etaMin)">{{ r.etaMin }}</span>
          <span class="bus-route-panel__eta-unit">мин</span>
        </div>
        <div class="bus-route-panel__main">
          <div class="bus-route-panel__line1">
            <span class="bus-route-panel__route-code">{{ r.route }}</span>
            <span class="bus-route-panel__plate">{{ r.plate }}</span>
          </div>
          <div class="bus-route-panel__line2">
            <span class="bus-route-panel__dist">{{ r.distKm }} км</span>
            <span class="bus-route-panel__dot">·</span>
            <span class="bus-route-panel__speed">{{ r.speedKmh }} км/ч</span>
          </div>
        </div>
      </div>

      <div v-if="rows.length === 0" class="bus-route-panel__empty">Нет данных</div>
    </div>
  </aside>
</template>

