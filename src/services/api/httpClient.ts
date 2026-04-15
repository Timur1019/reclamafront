import axios from 'axios'
import { apiBase } from '@/config/env'

export const httpClient = axios.create({
  baseURL: apiBase,
  timeout: 15000,
  headers: { Accept: 'application/json' },
})

httpClient.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err.response?.data?.message ?? err.message ?? 'Network error'
    return Promise.reject(new Error(typeof msg === 'string' ? msg : 'Request failed'))
  },
)
