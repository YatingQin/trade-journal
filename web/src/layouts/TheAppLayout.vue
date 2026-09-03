/**
 * @file TheAppLayout.vue
 * @description 应用主布局（顶部品牌 + 底部导航）
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

<template>
  <!-- S 应用壳 -->
  <div class="app-shell">
    <header class="top-bar">
      <div class="top-bar__inner">
        <div>
          <p class="brand-eyebrow">Personal Journal</p>
          <h1 class="brand-title">交易复盘</h1>
        </div>
        <button
          class="btn btn-secondary"
          type="button"
          @click="handleLogout"
        >
          退出
        </button>
      </div>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <nav class="bottom-nav" aria-label="主导航">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="bottom-nav__item"
        :class="{ 'bottom-nav__item--active': isNavActive(item.to) }"
      >
        <span class="bottom-nav__icon" aria-hidden="true" v-html="item.icon" />
        <span class="bottom-nav__label">{{ item.label }}</span>
      </RouterLink>
    </nav>
  </div>
  <!-- E 应用壳 -->
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const navItems = [
  {
    to: '/',
    label: '统计',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16V10"/><path d="M12 16V7"/><path d="M16 16v-4"/></svg>'
  },
  {
    to: '/trades',
    label: '交易',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 16l5-5 4 4 7-8"/><path d="M15 7h5v5"/></svg>'
  },
  {
    to: '/strategies',
    label: '策略',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>'
  },
  {
    to: '/reasons',
    label: '原因',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l2.2 4.5L19 8.3l-3.5 3.4.8 4.8L12 14.8 7.7 16.5l.8-4.8L5 8.3l4.8-.8L12 3z"/></svg>'
  },
  {
    to: '/accounts',
    label: '账户',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/><circle cx="16" cy="14" r="1.2"/></svg>'
  }
]

/**
 * @description 判断底部导航是否选中（首页仅精确匹配，避免一直高亮）
 * @param {string} to
 * @returns {boolean}
 */
function isNavActive(to) {
  if (to === '/') {
    return route.path === '/'
  }
  return route.path === to || route.path.startsWith(`${to}/`)
}

/**
 * @description 退出登录
 * @returns {void}
 */
function handleLogout() {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.top-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(12px);
  background: rgba(19, 23, 34, 0.88);
  border-bottom: 1px solid var(--color-border);
}

.top-bar__inner {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  min-height: var(--nav-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.brand-eyebrow {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.brand-title {
  margin: 2px 0 0;
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 600;
  color: #f0f3fa;
}

.bottom-nav {
  position: fixed;
  left: 50%;
  bottom: calc(12px + var(--safe-bottom));
  transform: translateX(-50%);
  width: min(520px, calc(100% - 24px));
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  padding: 6px;
  border-radius: 12px;
  background: rgba(30, 34, 45, 0.96);
  border: 1px solid var(--color-border);
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
}

.bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 48px;
  border-radius: 8px;
  color: var(--color-muted);
  font-size: 0.78rem;
  transition: background 0.2s ease, color 0.2s ease;
}

.bottom-nav__icon {
  display: inline-flex;
  width: 18px;
  height: 18px;
}

.bottom-nav__icon :deep(svg) {
  width: 18px;
  height: 18px;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.bottom-nav__item--active {
  background: rgba(41, 98, 255, 0.18);
  color: #8ab4ff;
}

@media (max-width: 768px) {
  .top-bar__inner {
    width: calc(100% - 24px);
  }

  .bottom-nav__label {
    font-size: 0.72rem;
  }
}
</style>
