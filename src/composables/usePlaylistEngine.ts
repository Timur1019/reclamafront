import type { Ref } from 'vue'
import { computed, onUnmounted, ref, watch } from 'vue'
import type { PlaylistSegment } from '@/types/playlist'

/**
 * Циклический плейлист. Если один сегмент (например только карта) — реклама не показывается.
 */
export function usePlaylistEngine(segmentsRef: Ref<PlaylistSegment[]>) {
  const index = ref(0)
  const remainingMs = ref(0)
  let segmentDeadline = Date.now()
  let tickTimer: ReturnType<typeof setInterval> | null = null

  const current = computed<PlaylistSegment>(() => {
    const segs = segmentsRef.value
    if (segs.length === 0) {
      return { kind: 'map', durationMs: 60_000 }
    }
    return segs[index.value % segs.length]!
  })

  function resetDeadline() {
    const cur = current.value
    segmentDeadline = Date.now() + cur.durationMs
    remainingMs.value = cur.durationMs
  }

  function advance() {
    const segs = segmentsRef.value
    if (segs.length <= 1) {
      resetDeadline()
      return
    }
    index.value = (index.value + 1) % segs.length
    resetDeadline()
  }

  function tick() {
    const segs = segmentsRef.value
    const cur = segs.length === 0 ? { kind: 'map' as const, durationMs: 60_000 } : current.value
    const left = Math.max(0, segmentDeadline - Date.now())
    remainingMs.value = left
    if (left <= 0) {
      if (segs.length <= 1) {
        resetDeadline()
      } else {
        advance()
      }
    }
  }

  watch(
    segmentsRef,
    () => {
      index.value = 0
      resetDeadline()
    },
    { deep: true },
  )

  tickTimer = setInterval(tick, 250)
  resetDeadline()

  onUnmounted(() => {
    if (tickTimer) {
      clearInterval(tickTimer)
    }
  })

  return { index, current, remainingMs }
}
