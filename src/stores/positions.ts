import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BusPosition } from '@/types/position'
import { fetchLatestPositions } from '@/services/api/positionsApi'
import { fetchPositionsForStop } from '@/services/api/stopsApi'

export const usePositionsStore = defineStore('positions', () => {
  const byBusId = ref<Record<string, BusPosition>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)
  /** Если задан — показываем только автобусы маршрутов через эту остановку (см. route_stops в БД) */
  const activeStopCode = ref<string | null>(null)
  /** BusId, разрешённые при последнем REST для остановки; STOMP обновляет только их */
  const eligibleBusIds = ref<Set<string>>(new Set())

  const list = computed(() => Object.values(byBusId.value))

  function applyRows(rows: BusPosition[]) {
    const next: Record<string, BusPosition> = {}
    for (const p of rows) {
      next[p.busId] = p
    }
    byBusId.value = next
  }

  function applyPosition(p: BusPosition) {
    if (activeStopCode.value) {
      if (eligibleBusIds.value.size === 0) {
        return
      }
      if (!eligibleBusIds.value.has(p.busId)) {
        return
      }
    }
    byBusId.value = { ...byBusId.value, [p.busId]: p }
  }

  async function loadScreen(stopCode: string | null) {
    loading.value = true
    error.value = null
    activeStopCode.value = stopCode && stopCode.length > 0 ? stopCode.trim().toUpperCase() : null
    try {
      if (activeStopCode.value) {
        const rows = await fetchPositionsForStop(activeStopCode.value)
        eligibleBusIds.value = new Set(rows.map((r) => r.busId))
        applyRows(rows)
      } else {
        eligibleBusIds.value = new Set()
        const rows = await fetchLatestPositions()
        applyRows(rows)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки'
    } finally {
      loading.value = false
    }
  }

  return { byBusId, list, loading, error, activeStopCode, loadScreen, applyPosition }
})
