/**
 * @file main.js
 * @description Vue 应用入口
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')