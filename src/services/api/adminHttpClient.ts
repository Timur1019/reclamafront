import axios from 'axios'
import { apiBase } from '@/config/env'
import { useAdminAuthStore } from '@/stores/adminAuth'

export const adminHttpClient = axios.create({
  baseURL: apiBase,
  timeout: 15000,
  headers: { Accept: 'application/json' },
})

adminHttpClient.interceptors.request.use((config) => {
  const auth = useAdminAuthStore()
  if (auth.basicToken) {
    config.headers.Authorization = `Basic ${auth.basicToken}`
  }
  return config
})

adminHttpClient.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      const auth = useAdminAuthStore()
      auth.clear()
      void import('@/router').then(({ router }) => {
        if (router.currentRoute.value.path !== '/admin/login') {
          void router.push({ path: '/admin/login', query: { redirect: router.currentRoute.value.fullPath } })
        }
      })
    }
    const msg = err.response?.data?.message ?? err.message ?? 'Network error'
    return Promise.reject(new Error(typeof msg === 'string' ? msg : 'Request failed'))
  },
)
