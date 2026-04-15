<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { adminCreateAd, adminDeleteAd, adminListAds, adminUpdateAd } from '@/services/api/adminAdsApi'
import type { AdAsset, AdAssetUpsert } from '@/types/adAsset'

const items = ref<AdAsset[]>([])
const loading = ref(false)
const err = ref<string | null>(null)
const editingId = ref<string | null>(null)

const form = ref<AdAssetUpsert>({
  title: '',
  mediaType: 'image',
  mediaUrl: '',
  durationSeconds: 15,
  enabled: true,
  sortOrder: 0,
})

async function load() {
  loading.value = true
  err.value = null
  try {
    items.value = await adminListAds()
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Ошибка'
  } finally {
    loading.value = false
  }
}

function startEdit(a: AdAsset) {
  editingId.value = a.id
  form.value = {
    title: a.title,
    mediaType: a.mediaType,
    mediaUrl: a.mediaUrl,
    durationSeconds: a.durationSeconds,
    enabled: a.enabled,
    sortOrder: a.sortOrder,
  }
}

function resetForm() {
  editingId.value = null
  form.value = {
    title: '',
    mediaType: 'image',
    mediaUrl: '',
    durationSeconds: 15,
    enabled: true,
    sortOrder: items.value.length,
  }
}

async function save() {
  loading.value = true
  err.value = null
  try {
    if (editingId.value) {
      await adminUpdateAd(editingId.value, form.value)
    } else {
      await adminCreateAd(form.value)
    }
    resetForm()
    await load()
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Ошибка сохранения'
  } finally {
    loading.value = false
  }
}

async function remove(id: string) {
  if (!confirm('Удалить ролик?')) {
    return
  }
  await adminDeleteAd(id)
  await load()
}

onMounted(() => void load())
</script>

<template>
  <div class="admin-ads-page container py-4">
    <div class="admin-ads-page__head d-flex justify-content-between align-items-center mb-3">
      <h1 class="h4 mb-0">Реклама на экранах</h1>
      <a class="btn btn-outline-secondary btn-sm" href="/">← Экран остановки</a>
    </div>
    <p class="text-secondary small admin-ads-page__lead">
      URL на картинку или видео (mp4/webm), длительность слота в секундах — как в плейлисте. Порядок — поле «sort».
    </p>
    <div v-if="err" class="alert alert-danger">{{ err }}</div>

    <div class="table-responsive admin-ads-page__table-wrap mb-4">
      <table class="table table-dark table-striped table-hover align-middle">
        <thead>
          <tr>
            <th>sort</th>
            <th>Название</th>
            <th>Тип</th>
            <th>Сек</th>
            <th>Вкл</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in items" :key="a.id">
            <td>{{ a.sortOrder }}</td>
            <td>{{ a.title }}</td>
            <td>{{ a.mediaType }}</td>
            <td>{{ a.durationSeconds }}</td>
            <td>{{ a.enabled ? 'да' : 'нет' }}</td>
            <td class="text-end">
              <button type="button" class="btn btn-sm btn-outline-primary me-1" @click="startEdit(a)">Изменить</button>
              <button type="button" class="btn btn-sm btn-outline-danger" @click="remove(a.id)">Удалить</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card bg-dark border-secondary admin-ads-page__form-card">
      <div class="card-body">
        <h2 class="h6 text-white mb-3">{{ editingId ? 'Редактирование' : 'Новый ролик' }}</h2>
        <form class="row g-2" @submit.prevent="save">
          <div class="col-md-6">
            <label class="form-label small">Заголовок</label>
            <input v-model="form.title" required class="form-control form-control-sm" />
          </div>
          <div class="col-md-2">
            <label class="form-label small">Тип</label>
            <select v-model="form.mediaType" class="form-select form-select-sm">
              <option value="image">image</option>
              <option value="video">video</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small">Секунды</label>
            <input v-model.number="form.durationSeconds" type="number" min="1" max="7200" required class="form-control form-control-sm" />
          </div>
          <div class="col-md-1">
            <label class="form-label small">Порядок</label>
            <input v-model.number="form.sortOrder" type="number" class="form-control form-control-sm" />
          </div>
          <div class="col-md-1 d-flex align-items-end">
            <div class="form-check">
              <input id="en" v-model="form.enabled" type="checkbox" class="form-check-input" />
              <label class="form-check-label small" for="en">Вкл</label>
            </div>
          </div>
          <div class="col-12">
            <label class="form-label small">URL медиа (https… или /ads/local.mp4)</label>
            <input v-model="form.mediaUrl" required class="form-control form-control-sm" />
          </div>
          <div class="col-12 mt-2">
            <button type="submit" class="btn btn-primary btn-sm me-2" :disabled="loading">Сохранить</button>
            <button v-if="editingId" type="button" class="btn btn-outline-light btn-sm" @click="resetForm">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
