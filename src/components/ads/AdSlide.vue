<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import type { AdMedia } from '@/types/playlist'

const props = withDefaults(
  defineProps<{
    title: string
    media: AdMedia
    /** Сегмент рекламы активен (смена слайда — пауза видео) */
    active: boolean
    /** Режим киоска: медиа на весь экран */
    fullscreen?: boolean
  }>(),
  { fullscreen: false },
)

const videoRef = ref<HTMLVideoElement | null>(null)

async function syncVideo() {
  await nextTick()
  if (props.media.type !== 'video') {
    return
  }
  const el = videoRef.value
  if (!el) {
    return
  }
  if (props.active) {
    el.currentTime = 0
    void el.play().catch(() => {
      /* автозапуск может быть заблокирован браузером до жеста */
    })
  } else {
    el.pause()
  }
}

watch(
  () => [props.active, props.media] as const,
  () => {
    void syncVideo()
  },
)

onMounted(() => {
  void syncVideo()
})
</script>

<template>
  <div class="ad-slide" :class="{ 'ad-slide--fullscreen': fullscreen }">
    <video
      v-if="media.type === 'video'"
      :key="media.src"
      ref="videoRef"
      class="ad-slide__video"
      :src="media.src"
      :poster="media.poster"
      muted
      playsinline
      preload="auto"
      loop
    />
    <img v-else class="ad-slide__img" :src="media.src" :alt="title" loading="lazy" />
    <div class="ad-slide__caption">{{ title }}</div>
  </div>
</template>
