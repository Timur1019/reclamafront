<script setup lang="ts">
import { computed } from 'vue'
import type { BusPosition } from '@/types/position'
import { haversineKm } from '@/utils/geo'
import { parseCoord, parseOptionalNumber } from '@/utils/coords'

const props = defineProps<{
  positions: BusPosition[]
  stopTarget: { lat: number; lng: number }
  stopTitle: string
  routeLabel?: string
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
  if (min <= 3) return 'bus-arrivals-board__eta-badge--urgent'
  if (min <= 10) return 'bus-arrivals-board__eta-badge--soon'
  return 'bus-arrivals-board__eta-badge--ok'
}
</script>

<template>
  <aside class="bus-arrivals-board" aria-label="Табло прибытия">
    <div class="bus-arrivals-board__head">
      <div class="bus-arrivals-board__title">Остановка</div>
      <div class="bus-arrivals-board__stop">{{ stopTitle }}</div>
      <div v-if="routeLabel" class="bus-arrivals-board__route-label">{{ routeLabel }}</div>
      <div class="bus-arrivals-board__sub">Демо-расчёт: по прямой + текущая скорость</div>
    </div>

    <div class="bus-arrivals-board__list">
      <div v-for="r in rows" :key="r.key" class="bus-arrivals-board__row">
        <div class="bus-arrivals-board__eta">
          <span class="bus-arrivals-board__eta-badge" :class="badgeClass(r.etaMin)">{{ r.etaMin }}</span>
          <span class="bus-arrivals-board__eta-unit">мин</span>
        </div>
        <div class="bus-arrivals-board__main">
          <div class="bus-arrivals-board__route">Маршрут {{ r.route }}</div>
          <div class="bus-arrivals-board__meta">
            <span class="bus-arrivals-board__plate">{{ r.plate }}</span>
            <span class="bus-arrivals-board__dot">·</span>
            <span class="bus-arrivals-board__dist">{{ r.distKm }} км</span>
            <span class="bus-arrivals-board__dot">·</span>
            <span class="bus-arrivals-board__speed">{{ r.speedKmh }} км/ч</span>
          </div>
        </div>
      </div>

      <div v-if="rows.length === 0" class="bus-arrivals-board__empty">Нет данных</div>
    </div>
  </aside>
</template>

