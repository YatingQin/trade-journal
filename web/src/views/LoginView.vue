/**
 * @file LoginView.vue
 * @description 登录页
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

<template>
  <!-- S 登录页 -->
  <div class="login-page">
    <section class="login-hero">
      <p class="login-kicker">Trade Review</p>
      <h1>交易复盘</h1>
      <p class="login-desc">
        记录 A股与美股交易，关联策略与止盈止损原因，随时查看盈亏与胜率。
      </p>
    </section>

    <form class="panel login-panel" @submit.prevent="handleSubmit">
      <h2>登录</h2>
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
      <div class="field">
        <label for="username">用户名</label>
        <input
          id="username"
          v-model.trim="form.username"
          autocomplete="username"
          required
        />
      </div>
      <div class="field">
        <label for="password">密码</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          autocomplete="current-password"
          required
        />
      </div>
      <button class="btn btn-primary btn-block" type="submit" :disabled="isLoading">
        {{ isLoading ? '登录中...' : '进入复盘' }}
      </button>
      <p class="login-hint">默认账号 admin / trade123（部署后请尽快修改）</p>
    </form>
  </div>
  <!-- E 登录页 -->
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const isLoading = ref(false)
const errorMessage = ref('')
const form = reactive({
  username: 'admin',
  password: ''
})

/**
 * @description 提交登录
 * @returns {Promise<void>}
 */
async function handleSubmit() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    await authStore.login(form)
    const redirect = typeof route.query.redirect === 'string'
      ? route.query.redirect
      : '/'
    router.replace(redirect)
  } catch (error) {
    errorMessage.value = error.response?.data?.message || '登录失败，请重试'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  gap: 24px;
}

.login-hero {
  width: min(480px, 100%);
  animation: rise-in 0.55s ease both;
}

.login-kicker {
  margin: 0 0 8px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-muted);
  font-size: 0.8rem;
}

.login-hero h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 8vw, 3.4rem);
  color: #f0f3fa;
  font-weight: 600;
}

.login-desc {
  margin: 12px 0 0;
  color: var(--color-muted);
  line-height: 1.6;
  max-width: 28rem;
}

.login-panel {
  width: min(420px, 100%);
  animation: rise-in 0.65s ease 0.08s both;
}

.login-panel h2 {
  margin: 0 0 16px;
  font-size: 1.2rem;
  color: #f0f3fa;
}

.login-hint {
  margin: 14px 0 0;
  color: var(--color-muted);
  font-size: 0.85rem;
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (min-width: 900px) {
  .login-page {
    grid-template-columns: 1.1fr 0.9fr;
    align-items: center;
    width: min(980px, calc(100% - 48px));
    margin: 0 auto;
  }
}
</style>
