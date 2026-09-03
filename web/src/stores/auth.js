/**
 * @file auth.js
 * @description 登录状态 Store
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiLogin, apiMe } from '@/api'
import { TOKEN_KEY } from '@/api/http'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref(null)

  const isLoggedIn = computed(() => Boolean(token.value))

  /**
   * @description 登录并保存 Token
   * @param {{ username: string, password: string }} payload
   * @returns {Promise<void>}
   */
  async function login(payload) {
    const { data } = await apiLogin(payload)
    token.value = data.token
    user.value = data.user
    localStorage.setItem(TOKEN_KEY, data.token)
  }

  /**
   * @description 拉取当前用户
   * @returns {Promise<boolean>}
   */
  async function fetchMe() {
    if (!token.value) {
      return false
    }
    try {
      const { data } = await apiMe()
      user.value = data
      return true
    } catch (error) {
      logout()
      return false
    }
  }

  /**
   * @description 退出登录
   * @returns {void}
   */
  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  return {
    token,
    user,
    isLoggedIn,
    login,
    fetchMe,
    logout
  }
})