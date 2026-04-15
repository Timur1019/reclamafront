import { onUnmounted } from 'vue'
import { Client, type IMessage } from '@stomp/stompjs'
import { wsBrokerUrl } from '@/config/env'
import type { BusPosition } from '@/types/position'
import { usePositionsStore } from '@/stores/positions'

export function useStompPositions() {
  const store = usePositionsStore()
  const client = new Client({
    brokerURL: wsBrokerUrl,
    reconnectDelay: 4000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  })

  client.onConnect = () => {
    client.subscribe('/topic/positions', (message: IMessage) => {
      try {
        const p = JSON.parse(message.body) as BusPosition
        if (p?.busId) {
          store.applyPosition(p)
        }
      } catch {
        /* ignore malformed */
      }
    })
  }

  client.onStompError = (frame) => {
    console.warn('[STOMP]', frame.headers['message'] ?? frame.body)
  }

  client.activate()

  onUnmounted(() => {
    client.deactivate()
  })

  return { client }
}
