/**
 * @file http.js
 * @description Axios 请求封装
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

import axios from 'axios'

const TOKEN_KEY = 'trade_journal_token'

const http = axios.create({
  baseURL: '/api',
  timeout: 15000
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export { TOKEN_KEY }
export default http
