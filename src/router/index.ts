import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/today',
    },
    {
      path: '/today',
      component: () => import('@/pages/TodayPage.vue'),
    },
    {
      path: '/history',
      component: () => import('@/pages/HistoryPage.vue'),
    },
    {
      path: '/meals',
      component: () => import('@/pages/MealsPage.vue'),
    },
    {
      path: '/settings',
      component: () => import('@/pages/SettingsPage.vue'),
    },
  ],
})

export default router
