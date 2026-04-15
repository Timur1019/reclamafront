import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  // Render кладёт переменные в process.env при сборке; loadEnv в основном из .env-файлов — смотрим оба источника.
  const viteApiBase = (env.VITE_API_BASE ?? process.env.VITE_API_BASE ?? '').trim()
  if (process.env.RENDER === 'true' && mode === 'production' && !viteApiBase) {
    throw new Error(
      'На Render в Environment добавь VITE_API_BASE (URL бэкенда без слэша в конце) и сделай Save → rebuild and deploy.',
    )
  }

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: [
            'import',
            'global-builtin',
            'color-functions',
            'if-function',
          ],
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
        '/ws': {
          target: 'ws://localhost:8080',
          ws: true,
        },
      },
    },
  }
})
