import { onMounted, onUnmounted, watch, type Ref } from 'vue'
import { usePositionsStore } from '@/stores/positions'
import { demoPositionsNow } from '@/mock/demoPositions'

/**
 * Демо-генератор позиций: периодически обновляет store,
 * имитируя приход GPS/WS без backend.
 */
export function useDemoPositions(opts?: { tickMs?: number; enabled?: Ref<boolean> }) {
  const store = usePositionsStore()
  const tickMs = Math.max(250, opts?.tickMs ?? 900)
  const enabled: Ref<boolean> = opts?.enabled ?? ({ value: true } as Ref<boolean>)

  let t: ReturnType<typeof setInterval> | null = null

  function tick() {
    const rows = demoPositionsNow()
    for (const p of rows) {
      store.applyPosition(p)
    }
  }

  function start() {
    if (t) return
    tick()
    t = setInterval(tick, tickMs)
  }

  function stop() {
    if (!t) return
    clearInterval(t)
    t = null
  }

  onMounted(() => {
    if (enabled.value) {
      start()
    }
  })

  watch(
    enabled,
    (v) => {
      if (v) start()
      else stop()
    },
    { immediate: true },
  )

  onUnmounted(() => {
    stop()
  })

  return { tick, start, stop }
}

