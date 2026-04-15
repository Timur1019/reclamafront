<script setup lang="ts">
import { computed } from 'vue'
import type { BusPosition } from '@/types/position'
import { isInsideSamarkand, haversineKm } from '@/utils/geo'
import { parseCoord, parseOptionalNumber } from '@/utils/coords'

const props = defineProps<{
  positions: BusPosition[]
  /** Координаты выбранной остановки (?stop=) — для оценки времени прибытия */
  stopTarget: { lat: number; lng: number } | null
  stopCode: string | null
}>()

function formatSamarkandTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Asia/Samarkand',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(iso))
  } catch {
    return '—'
  }
}

function formatSamarkandTimeShort(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Asia/Samarkand',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return '—'
  }
}

type ArrivalRow = BusPosition & {
  arrivalClock: string
  arrivalSub: string
  arrivalKind: 'at' | 'eta' | 'na'
}

function buildArrivalRow(p: BusPosition): ArrivalRow {
  const target = props.stopTarget
  if (!target) {
    return { ...p, arrivalClock: '—', arrivalSub: '', arrivalKind: 'na' }
  }
  const lat = parseCoord(p.latitude)
  const lon = parseCoord(p.longitude)
  const distKm = haversineKm(lat, lon, target.lat, target.lng)
  if (distKm < 0.18) {
    return { ...p, arrivalClock: 'У остановки', arrivalSub: '', arrivalKind: 'at' }
  }
  const speedFromGps = parseOptionalNumber(p.speedKmh)
  const speedKmh = Math.max(speedFromGps ?? 0, 22)
  let minutes = (distKm / speedKmh) * 60
  if (!Number.isFinite(minutes) || minutes < 1) {
    minutes = 1
  }
  if (minutes > 240) {
    minutes = 240
  }
  const arrival = new Date(Date.now() + minutes * 60 * 1000)
  const clock = formatSamarkandTime(arrival.toISOString())
  const sub = `≈ ${Math.round(minutes)} мин · ${distKm.toFixed(1)} км по прямой`
  return { ...p, arrivalClock: clock, arrivalSub: sub, arrivalKind: 'eta' }
}

const sorted = computed(() =>
  [...props.positions].sort((a, b) => a.plateNumber.localeCompare(b.plateNumber, 'ru')),
)

const inZone = computed(() =>
  sorted.value.filter((p) => isInsideSamarkand(parseCoord(p.latitude), parseCoord(p.longitude))),
)

const rows = computed(() => inZone.value.map(buildArrivalRow))

const outZone = computed(() => sorted.value.length - inZone.value.length)

const panelHint = computed(() => {
  if (props.stopCode && props.stopTarget) {
    return 'Время прибытия — оценка по прямой до остановки и текущей скорости (не по расписанию).'
  }
  if (props.stopCode && !props.stopTarget) {
    return 'Остановка в справочнике не найдена — прибытие не считается.'
  }
  return 'Для колонки «Прибытие» откройте экран с ?stop=КОД (координаты остановки из справочника).'
})
</script>

<template>
  <aside class="bus-fleet-panel" aria-label="Автобусы на линии">
    <div class="bus-fleet-panel__head">
      <span class="bus-fleet-panel__title">График ТС</span>
      <span class="bus-fleet-panel__badge">{{ inZone.length }}</span>
      <span v-if="outZone > 0" class="bus-fleet-panel__hint">вне зоны: {{ outZone }}</span>
    </div>
    <p class="bus-fleet-panel__lead">{{ panelHint }}</p>
    <div class="bus-fleet-panel__scroll">
      <table class="bus-fleet-panel__table">
        <thead>
          <tr>
            <th>Госномер</th>
            <th>Маршрут</th>
            <th>км/ч</th>
            <th>Прибытие</th>
            <th>Сигнал GPS</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.busId">
            <td class="bus-fleet-panel__plate">{{ r.plateNumber }}</td>
            <td class="bus-fleet-panel__route">{{ r.routeCode ?? '—' }}</td>
            <td class="bus-fleet-panel__speed">{{ r.speedKmh ?? '—' }}</td>
            <td
              class="bus-fleet-panel__arrival"
              :class="{
                'bus-fleet-panel__arrival--at': r.arrivalKind === 'at',
                'bus-fleet-panel__arrival--eta': r.arrivalKind === 'eta',
                'bus-fleet-panel__arrival--na': r.arrivalKind === 'na',
              }"
            >
              <span class="bus-fleet-panel__arrival-clock">{{ r.arrivalClock }}</span>
              <span v-if="r.arrivalSub" class="bus-fleet-panel__arrival-sub">{{ r.arrivalSub }}</span>
            </td>
            <td class="bus-fleet-panel__signal">{{ formatSamarkandTimeShort(r.reportedAt) }}</td>
          </tr>
          <tr v-if="rows.length === 0">
            <td colspan="5" class="bus-fleet-panel__empty">
              <template v-if="sorted.length === 0">
                Нет позиций с backend (или фильтр ?stop= без маршрутов). Реальные координаты — POST
                /api/vehicles/positions; в пустой БД миграция v3 добавляет демо-автобус.
              </template>
              <template v-else>Нет ТС в зоне Самарканда</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </aside>
</template>
