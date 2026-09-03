/**
 * @file StrategiesView.vue
 * @description 策略管理页
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */
<template>
  <section>
    <h2 class="page-title">策略</h2>
    <p class="page-subtitle">维护可复用的交易策略，录入交易时可直接关联。</p>
    <form class="panel" @submit.prevent="handleSubmit">
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
      <div class="field"><label for="name">策略名称</label><input id="name" v-model.trim="form.name" required /></div>
      <div class="field"><label for="description">说明</label><textarea id="description" v-model.trim="form.description" rows="3" /></div>
      <div class="form-actions">
        <button class="btn btn-primary" type="submit">{{ form.id ? '更新策略' : '新增策略' }}</button>
        <button v-if="form.id" class="btn btn-secondary" type="button" @click="handleReset">取消编辑</button>
      </div>
    </form>
    <div class="panel">
      <div v-if="!list.length" class="empty-state">暂无策略</div>
      <div v-for="item in list" :key="item.id" class="list-card">
        <div><h3>{{ item.name }}</h3><p>{{ item.description || '暂无说明' }}</p></div>
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
import { apiCreateStrategy, apiDeleteStrategy, apiGetStrategies, apiUpdateStrategy } from '@/api'
const list = ref([])
const errorMessage = ref('')
const form = reactive({ id: null, name: '', description: '' })
function handleReset() { form.id = null; form.name = ''; form.description = '' }
async function handleLoad() {
  errorMessage.value = ''
  try { const { data } = await apiGetStrategies(); list.value = data } catch (e) { errorMessage.value = e.response?.data?.message || '加载失败' }
}
function handleEdit(item) { form.id = item.id; form.name = item.name; form.description = item.description || '' }
async function handleSubmit() {
  errorMessage.value = ''
  try {
    const payload = { name: form.name, description: form.description }
    if (form.id) await apiUpdateStrategy(form.id, payload); else await apiCreateStrategy(payload)
    handleReset(); await handleLoad()
  } catch (e) { errorMessage.value = e.response?.data?.message || '保存失败' }
}
async function handleDelete(id) {
  if (!window.confirm('确认删除该策略？')) return
  try { await apiDeleteStrategy(id); if (form.id === id) handleReset(); await handleLoad() } catch (e) { errorMessage.value = e.response?.data?.message || '删除失败' }
}
onMounted(handleLoad)
</script>