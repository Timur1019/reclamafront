<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminAuthStore } from '@/stores/adminAuth'

const route = useRoute()
const router = useRouter()
const auth = useAdminAuthStore()

const username = ref('')
const password = ref('')
const err = ref<string | null>(null)
const submitting = ref(false)

async function submit() {
  err.value = null
  submitting.value = true
  try {
    auth.setBasicCredentials(username.value.trim(), password.value)
    const { adminListAds } = await import('@/services/api/adminAdsApi')
    await adminListAds()
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/admin/ads'
    await router.replace(redirect || '/admin/ads')
  } catch {
    auth.clear()
    err.value = 'Неверный логин или пароль'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="admin-login">
    <div class="admin-login__card card shadow-sm">
      <div class="card-body p-4">
        <h1 class="admin-login__title h5 mb-3">Вход в админку</h1>
        <p class="admin-login__hint text-muted small mb-4">
          Логин и пароль задаются в <code>application.yml</code> (<code>app.admin.username</code> /
          <code>app.admin.password</code>).
        </p>
        <form class="admin-login__form" @submit.prevent="submit">
          <div class="mb-3">
            <label class="form-label" for="admin-user">Логин</label>
            <input
              id="admin-user"
              v-model="username"
              class="form-control"
              type="text"
              autocomplete="username"
              required
            />
          </div>
          <div class="mb-3">
            <label class="form-label" for="admin-pass">Пароль</label>
            <input
              id="admin-pass"
              v-model="password"
              class="form-control"
              type="password"
              autocomplete="current-password"
              required
            />
          </div>
          <p v-if="err" class="admin-login__error text-danger small mb-3">{{ err }}</p>
          <button class="btn btn-primary w-100" type="submit" :disabled="submitting">
            {{ submitting ? 'Проверка…' : 'Войти' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss" src="@/styles/admin-login.scss"></style>
