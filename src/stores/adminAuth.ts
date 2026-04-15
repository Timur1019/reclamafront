import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const STORAGE_KEY = 'reclama_admin_basic'

function readStored(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export const useAdminAuthStore = defineStore('adminAuth', () => {
  const basicToken = ref<string | null>(readStored())

  const isAuthenticated = computed(() => Boolean(basicToken.value?.length))

  function setBasicCredentials(username: string, password: string) {
    const token = btoa(`${username}:${password}`)
    basicToken.value = token
    try {
      sessionStorage.setItem(STORAGE_KEY, token)
    } catch {
      /* ignore quota / private mode */
    }
  }

  function clear() {
    basicToken.value = null
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }

  return { basicToken, isAuthenticated, setBasicCredentials, clear }
})
