/**
 * @file index.js
 * @description 前端路由配置
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true }
    },
    {
      path: '/',
      component: () => import('@/layouts/TheAppLayout.vue'),
      children: [
        {
          path: '',
          name: 'stats',
          component: () => import('@/views/StatsView.vue')
        },
        {
          path: 'trades',
          name: 'trades',
          component: () => import('@/views/TradesView.vue')
        },
        {
          path: 'trades/new',
          name: 'trade-create',
          component: () => import('@/views/TradeFormView.vue')
        },
        {
          path: 'trades/:id/edit',
          name: 'trade-edit',
          component: () => import('@/views/TradeFormView.vue')
        },
        {
          path: 'strategies',
          name: 'strategies',
          component: () => import('@/views/StrategiesView.vue')
        },
        {
          path: 'accounts',
          name: 'accounts',
          component: () => import('@/views/AccountsView.vue')
        },
        {
          path: 'reasons',
          name: 'reasons',
          component: () => import('@/views/ReasonsView.vue')
        }
      ]
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  if (to.meta.public) {
    if (authStore.isLoggedIn && to.name === 'login') {
      return { name: 'stats' }
    }
    return true
  }

  if (!authStore.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (!authStore.user) {
    const ok = await authStore.fetchMe()
    if (!ok) {
      return { name: 'login' }
    }
  }

  return true
})

export default router
