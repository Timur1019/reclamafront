import { computed, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import type { BusPosition } from '@/types/position'
import { haversineKm } from '@/utils/geo'
import { parseCoord, parseOptionalNumber } from '@/utils/coords'

type AnnouncementLevel = 'soon' | 'arrived'

type AnnounceOpts = {
  enabled: Ref<boolean>
  positions: Ref<BusPosition[]>
  stopTarget: Ref<{ lat: number; lng: number } | null>
  stopTitle: Ref<string>
  /** интервал проверки, мс */
  tickMs?: number
  /** порог "скоро", минут */
  soonMin?: number
  /** порог "у остановки", км */
  arrivedKm?: number
}

const DEFAULT_TICK_MS = 2500
const DEFAULT_SOON_MIN = 2
const DEFAULT_ARRIVED_KM = 0.18
const COOLDOWN_MS = 60_000

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n))
}

function pickRussianVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices()
  const ru = voices.filter((v) => (v.lang || '').toLowerCase().startsWith('ru'))
  return ru.find((v) => /google/i.test(v.name)) ?? ru[0] ?? voices[0] ?? null
}

function etaMinFor(p: BusPosition, stop: { lat: number; lng: number }): { etaMin: number; distKm: number } {
  const lat = parseCoord(p.latitude)
  const lng = parseCoord(p.longitude)
  const distKm = haversineKm(lat, lng, stop.lat, stop.lng)
  const speedFromGps = parseOptionalNumber(p.speedKmh)
  const speedKmh = clamp(Math.round(Math.max(speedFromGps ?? 0, 22)), 10, 88)
  let etaMin = Math.round((distKm / speedKmh) * 60)
  if (!Number.isFinite(etaMin)) etaMin = 99
  etaMin = clamp(etaMin, 0, 99)
  return { etaMin, distKm }
}

export function useRouteVoiceAnnouncements(opts: AnnounceOpts) {
  const tickMs = Math.max(700, opts.tickMs ?? DEFAULT_TICK_MS)
  const soonMin = opts.soonMin ?? DEFAULT_SOON_MIN
  const arrivedKm = opts.arrivedKm ?? DEFAULT_ARRIVED_KM

  const supported = computed(() => typeof window !== 'undefined' && 'speechSynthesis' in window)
  const blockedHint = ref<string | null>(null)

  const lastSaidAt = ref<Record<string, number>>({})
  const lastLevel = ref<Record<string, AnnouncementLevel>>({})
  const lastText = ref<string | null>(null)

  let t: ReturnType<typeof setInterval> | null = null
  let voice: SpeechSynthesisVoice | null = null

  function canSay(busId: string, level: AnnouncementLevel, now: number): boolean {
    const prevAt = lastSaidAt.value[busId] ?? 0
    const prevLevel = lastLevel.value[busId]
    if (prevLevel === 'arrived') return false
    if (level === prevLevel && now - prevAt < COOLDOWN_MS) return false
    if (now - prevAt < COOLDOWN_MS / 2) return false
    return true
  }

  function say(text: string) {
    if (!supported.value) return
    try {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'ru-RU'
      u.rate = 1
      u.pitch = 1
      u.volume = 1
      u.voice = voice
      speechSynthesis.cancel()
      speechSynthesis.speak(u)
      blockedHint.value = null
      lastText.value = text
    } catch {
      blockedHint.value = 'Браузер заблокировал голос. Нужен клик по странице (жест пользователя).'
    }
  }

  function tick() {
    if (!opts.enabled.value) return
    if (!supported.value) return
    const stop = opts.stopTarget.value
    if (!stop) return

    const now = Date.now()
    const list = opts.positions.value
      .map((p) => ({ p, ...etaMinFor(p, stop) }))
      .sort((a, b) => a.etaMin - b.etaMin)
      .slice(0, 3)

    for (const it of list) {
      const p = it.p
      const route = String(p.routeCode ?? '').trim()
      if (!route) continue

      const level: AnnouncementLevel = it.distKm <= arrivedKm ? 'arrived' : 'soon'
      if (level === 'soon' && it.etaMin > soonMin) continue

      if (!canSay(p.busId, level, now)) continue
      lastSaidAt.value = { ...lastSaidAt.value, [p.busId]: now }
      lastLevel.value = { ...lastLevel.value, [p.busId]: level }

      const stopTitle = opts.stopTitle.value || 'остановке'
      if (level === 'arrived') {
        say(`Маршрут ${route}. Автобус у остановки ${stopTitle}.`)
      } else {
        say(`Маршрут ${route}. Прибытие через ${it.etaMin} минут.`)
      }
      break
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
    if (!supported.value) return
    // голоса загружаются асинхронно в некоторых браузерах
    const applyVoice = () => {
      voice = pickRussianVoice()
    }
    applyVoice()
    speechSynthesis.onvoiceschanged = applyVoice
    start()
  })

  watch(
    opts.enabled,
    (v) => {
      if (v) start()
      else stop()
    },
    { immediate: true },
  )

  onUnmounted(() => {
    stop()
  })

  function testSpeak() {
    if (!supported.value) {
      blockedHint.value = 'Голосовые оповещения не поддерживаются в этом браузере.'
      return
    }
    say('Проверка звука. Голосовые оповещения включены.')
  }

  return { supported, blockedHint, lastText, testSpeak }
}

