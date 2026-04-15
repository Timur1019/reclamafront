<script setup lang="ts">
/**
 * Виджет Яндекс.Карт (встраивание без отдельного MapKit-ключа для прототипа экрана).
 * Маркеры автобусов на iframe не рисуются — позиции смотрите в панели справа / в режиме Leaflet.
 */
const SAMARKAND_LL = '66.975,39.654'
const ZOOM = 12
const src = `https://yandex.ru/map-widget/v1/?ll=${SAMARKAND_LL}&z=${ZOOM}&lang=ru_RU`
</script>

<template>
  <div class="yandex-map-view">
    <p class="yandex-map-view__notice" role="note">
      Виджет Яндекса: свои маркеры ТС сюда не передаются. Список ТС справа; точки на карте — в режиме Leaflet.
    </p>
    <iframe
      class="yandex-map-view__frame"
      :src="src"
      title="Карта — Яндекс"
      allowfullscreen
    />
  </div>
</template>
