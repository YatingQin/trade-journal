/**
 * @file ReasonsView.vue
 * @description 止盈止损原因管理页
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */
<template>
  <section>
    <h2 class="page-title">离场原因</h2>
    <p class="page-subtitle">预设止盈、止损及其他原因，平仓时快速选择。</p>
    <form class="panel" @submit.prevent="handleSubmit">
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
      <div class="grid-2">
        <div class="field"><label for="name">原因名称</label><input id="name" v-model.trim="form.name" required /></div>
        <div class="field"><label for="reason_type">类型</label><select id="reason_type" v-model="form.reason_type" required><option value="take_profit">止盈</option><option value="stop_loss">止损</option><option value="other">其他</option></select></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" type="submit">{{ form.id ? '更新原因' : '新增原因' }}</button>
        <button v-if="form.id" class="btn btn-secondary" type="button" @click="handleReset">取消编辑</button>
      </div>
    </form>
    <div class="panel">
      <div v-if="!list.length" class="empty-state">暂无原因</div>
      <div v-for="item in list" :key="item.id" class="list-card">
        <div><h3 class="reason-name-row"><span>{{ item.name }}</span><BaseReasonTag :reason-type="item.reason_type" /></h3></div>
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
import { apiCreateExitReason, apiDeleteExitReason, apiGetExitReasons, apiUpdateExitReason } from '@/api'
import BaseReasonTag from '@/components/BaseReasonTag.vue'
const list = ref([])
const errorMessage = ref('')
const form = reactive({ id: null, name: '', reason_type: 'take_profit' })
function handleReset() { form.id = null; form.name = ''; form.reason_type = 'take_profit' }
async function handleLoad() {
  errorMessage.value = ''
  try { const { data } = await apiGetExitReasons(); list.value = data } catch (e) { errorMessage.value = e.response?.data?.message || '加载失败' }
}
function handleEdit(item) { form.id = item.id; form.name = item.name; form.reason_type = item.reason_type }
async function handleSubmit() {
  errorMessage.value = ''
  try {
    const payload = { name: form.name, reason_type: form.reason_type }
    if (form.id) await apiUpdateExitReason(form.id, payload); else await apiCreateExitReason(payload)
    handleReset(); await handleLoad()
  } catch (e) { errorMessage.value = e.response?.data?.message || '保存失败' }
}
async function handleDelete(id) {
  if (!window.confirm('确认删除该原因？')) return
  try { await apiDeleteExitReason(id); if (form.id === id) handleReset(); await handleLoad() } catch (e) { errorMessage.value = e.response?.data?.message || '删除失败' }
}
onMounted(handleLoad)
</script>
<style scoped>
.reason-name-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
</style>