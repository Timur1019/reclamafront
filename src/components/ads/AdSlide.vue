<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'
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
const mediaError = ref<string | null>(null)
const soundEnabled = ref(false)
const needsSoundGesture = ref(false)

const SOUND_KEY = 'smartstop.sound.enabled'

function loadSoundPref(): boolean {
  try {
    const v = localStorage.getItem(SOUND_KEY)
    if (v == null) {
      // По умолчанию включаем звук (как попросили).
      return true
    }
    return v === '1'
  } catch {
    return true
  }
}

function saveSoundPref(v: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, v ? '1' : '0')
  } catch {
    /* ignore */
  }
}

const mediaKindLabel = computed(() => {
  if (props.media.type === 'video') return 'Видео'
  if (props.media.type === 'youtube') return 'YouTube'
  return 'Изображение'
})

const youtubeSrc = computed(() => {
  if (props.media.type !== 'youtube') return null
  const u = new URL(props.media.src)
  // важное: autoplay в iframe обычно работает только в mute=1
  u.searchParams.set('mute', soundEnabled.value ? '0' : '1')
  u.searchParams.set('autoplay', props.active ? '1' : '0')
  return u.toString()
})

function hintForSrc(src: string): string {
  const s = String(src ?? '')
  if (s.startsWith('http://')) {
    return 'Ссылка начинается с http:// — в https-сайтах браузер блокирует такое видео. Нужна https:// ссылка.'
  }
  if (s.includes('youtube.com') || s.includes('youtu.be')) {
    return 'Ссылки на YouTube должны проигрываться через встроенный плеер (iframe), а не через <video>.'
  }
  return 'Нужна прямая ссылка на файл (обычно .mp4/.webm) с корректным CORS и Content-Type.'
}

async function syncVideo() {
  await nextTick()
  if (props.media.type !== 'video') {
    return
  }
  const el = videoRef.value
  if (!el) {
    return
  }
  el.muted = !soundEnabled.value
  el.volume = soundEnabled.value ? 1 : 0
  if (props.active) {
    el.currentTime = 0
    needsSoundGesture.value = false
    void el.play().catch(() => {
      // Автозапуск со звуком часто блокируется — попросим клик.
      needsSoundGesture.value = soundEnabled.value
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
  soundEnabled.value = loadSoundPref()
  void syncVideo()
})

watch(
  () => props.media,
  () => {
    mediaError.value = null
    needsSoundGesture.value = false
  },
)

function onMediaError() {
  mediaError.value = `${mediaKindLabel.value} не загружается. ${hintForSrc(props.media.src)}`
}

async function toggleSound() {
  soundEnabled.value = !soundEnabled.value
  saveSoundPref(soundEnabled.value)
  mediaError.value = null
  needsSoundGesture.value = false
  // Для HTML5 video пробуем сразу воспроизвести со звуком (может потребовать жест пользователя — этот клик подходит).
  if (props.media.type === 'video') {
    await nextTick()
    const el = videoRef.value
    if (el) {
      el.muted = !soundEnabled.value
      el.volume = soundEnabled.value ? 1 : 0
      if (props.active) {
        try {
          await el.play()
        } catch {
          /* ignore */
        }
      }
    }
  }
}
</script>

<template>
  <div class="ad-slide" :class="{ 'ad-slide--fullscreen': fullscreen }">
    <button class="ad-slide__sound" type="button" @click="toggleSound">
      Звук: {{ soundEnabled ? 'Вкл' : 'Выкл' }}
    </button>
    <button
      v-if="needsSoundGesture"
      class="ad-slide__sound-gesture"
      type="button"
      @click="toggleSound"
    >
      Нажмите, чтобы включить звук
    </button>
    <iframe
      v-if="media.type === 'youtube'"
      :key="youtubeSrc ?? media.src"
      class="ad-slide__video"
      :src="youtubeSrc ?? media.src"
      title="YouTube"
      frameborder="0"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowfullscreen
      @error="onMediaError"
    />
    <video
      v-else-if="media.type === 'video'"
      :key="media.src"
      ref="videoRef"
      class="ad-slide__video"
      :src="media.src"
      :poster="media.poster"
      autoplay
      :muted="!soundEnabled"
      playsinline
      preload="auto"
      loop
      crossorigin="anonymous"
      @error="onMediaError"
    />
    <img v-else class="ad-slide__img" :src="media.src" :alt="title" loading="lazy" @error="onMediaError" />
    <div class="ad-slide__caption">{{ title }}</div>
    <div v-if="mediaError" class="ad-slide__error" role="alert">
      <div class="ad-slide__error-title">Проблема с медиа</div>
      <div class="ad-slide__error-text">{{ mediaError }}</div>
      <a class="ad-slide__error-link" :href="media.src" target="_blank" rel="noreferrer">Открыть ссылку</a>
    </div>
  </div>
</template>
