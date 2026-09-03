/**
 * @file AccountsView.vue
 * @description 账户管理页
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */
<template>
  <section>
    <h2 class="page-title">账户</h2>
    <p class="page-subtitle">区分 A股 / 美股账户，统计时可按账户查看盈亏。</p>
    <form class="panel" @submit.prevent="handleSubmit">
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
      <div class="grid-2">
        <div class="field"><label for="name">账户名称</label><input id="name" v-model.trim="form.name" required /></div>
        <div class="field"><label for="market">市场</label><select id="market" v-model="form.market" required><option value="CN">A股（CNY）</option><option value="US">美股（USD）</option></select></div>
      </div>
      <div class="field"><label for="note">备注</label><input id="note" v-model.trim="form.note" /></div>
      <div class="form-actions">
        <button class="btn btn-primary" type="submit">{{ form.id ? '更新账户' : '新增账户' }}</button>
        <button v-if="form.id" class="btn btn-secondary" type="button" @click="handleReset">取消编辑</button>
      </div>
    </form>
    <div class="panel">
      <div v-if="!list.length" class="empty-state">暂无账户</div>
      <div v-for="item in list" :key="item.id" class="list-card">
        <div>
          <h3>{{ item.name }}</h3>
          <p>{{ formatMarket(item.market) }} · {{ item.currency }}<template v-if="item.note"> · {{ item.note }}</template></p>
        </div>
        <div class="inline-actions">
          <button class="btn btn-secondary" type="button" @click="handleEdit(item)">编辑</button>
          <button class="btn btn-danger" type="button" @click="handleDelete(item.id)">删除</button>
        </div>
      </div>
    </div>
  </section>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue'
import { apiCreateAccount, apiDeleteAccount, apiGetAccounts, apiUpdateAccount } from '@/api'
import { formatMarket } from '@/utils/format'
const list = ref([])
const errorMessage = ref('')
const form = reactive({ id: null, name: '', market: 'CN', note: '' })
function handleReset() { form.id = null; form.name = ''; form.market = 'CN'; form.note = '' }
async function handleLoad() {
  errorMessage.value = ''
  try { const { data } = await apiGetAccounts(); list.value = data } catch (e) { errorMessage.value = e.response?.data?.message || '加载失败' }
}
function handleEdit(item) { form.id = item.id; form.name = item.name; form.market = item.market; form.note = item.note || '' }
async function handleSubmit() {
  errorMessage.value = ''
  try {
    const payload = { name: form.name, market: form.market, note: form.note }
    if (form.id) await apiUpdateAccount(form.id, payload); else await apiCreateAccount(payload)
    handleReset(); await handleLoad()
  } catch (e) { errorMessage.value = e.response?.data?.message || '保存失败' }
}
async function handleDelete(id) {
  if (!window.confirm('确认删除该账户？')) return
  try { await apiDeleteAccount(id); if (form.id === id) handleReset(); await handleLoad() } catch (e) { errorMessage.value = e.response?.data?.message || '删除失败' }
}
onMounted(handleLoad)
</script>