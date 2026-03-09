import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/daily',
    },
    {
      path: '/daily',
      component: () => import('@/pages/DailyPage.vue'),
    },
    {
      path: '/history',
      component: () => import('@/pages/HistoryPage.vue'),
    },
    {
      path: '/recommend',
      component: () => import('@/pages/RecommendPage.vue'),
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
