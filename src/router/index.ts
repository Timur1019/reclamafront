import { createRouter, createWebHistory } from 'vue-router'
import ScreenPage from '@/pages/ScreenPage.vue'
import AdminAdsPage from '@/pages/AdminAdsPage.vue'
import AdminLoginPage from '@/pages/AdminLoginPage.vue'
import { useAdminAuthStore } from '@/stores/adminAuth'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'screen', component: ScreenPage },
    {
      path: '/demo',
      name: 'screen-demo',
      redirect: { path: '/', query: { demo: '1' } },
    },
    { path: '/admin/login', name: 'admin-login', component: AdminLoginPage },
    {
      path: '/admin/ads',
      name: 'admin-ads',
      component: AdminAdsPage,
      meta: { requiresAdminAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  if (!to.meta.requiresAdminAuth) {
    return true
  }
  const auth = useAdminAuthStore()
  if (auth.isAuthenticated) {
    return true
  }
  return { path: '/admin/login', query: { redirect: to.fullPath } }
})
