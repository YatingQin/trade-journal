/**
 * @file TradeFormView.vue
 * @description 交易新增/编辑表单
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

<template>
  <!-- S 交易表单 -->
  <section>
    <h2 class="page-title">{{ isEdit ? '编辑交易' : '新增交易' }}</h2>
    <p class="page-subtitle">填写买卖信息，可关联策略；平仓时选择止盈/止损原因。</p>

    <form class="panel" @submit.prevent="handleSubmit">
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

      <div class="grid-2">
        <div class="field">
          <label for="account_id">账户</label>
          <select
            id="account_id"
            v-model="form.account_id"
            required
            @change="handleAccountChange"
          >
            <option disabled value="">请选择</option>
            <option
              v-for="item in accounts"
              :key="item.id"
              :value="String(item.id)"
            >
              {{ item.name }}（{{ formatMarket(item.market) }}）
            </option>
          </select>
        </div>
        <div class="field">
          <label for="market">市场</label>
          <select id="market" v-model="form.market" required disabled>
            <option value="CN">A股</option>
            <option value="US">美股</option>
          </select>
        </div>
      </div>

      <div class="grid-2">
        <div class="field">
          <label for="symbol">标的代码</label>
          <input
            id="symbol"
            v-model.trim="form.symbol"
            placeholder="600519 / AAPL"
            required
          />
        </div>
        <div class="field">
          <label for="direction">方向</label>
          <select id="direction" v-model="form.direction" required>
            <option value="long">做多</option>
            <option value="short">做空</option>
          </select>
        </div>
      </div>

      <div class="grid-2">
        <div class="field">
          <label for="strategy_id">策略</label>
          <select id="strategy_id" v-model="form.strategy_id">
            <option value="">不关联</option>
            <option
              v-for="item in strategies"
              :key="item.id"
              :value="String(item.id)"
            >
              {{ item.name }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="status">状态</label>
          <select id="status" v-model="form.status">
            <option value="open">持仓中</option>
            <option value="closed">已平仓</option>
          </select>
        </div>
      </div>

      <div class="grid-3">
        <div class="field">
          <label for="quantity">数量</label>
          <input
            id="quantity"
            v-model.number="form.quantity"
            type="number"
            min="0"
            step="any"
            required
          />
        </div>
        <div class="field">
          <label for="entry_price">入场价</label>
          <input
            id="entry_price"
            v-model.number="form.entry_price"
            type="number"
            min="0"
            step="any"
            required
          />
        </div>
        <div class="field">
          <label for="fee">手续费</label>
          <input
            id="fee"
            v-model.number="form.fee"
            type="number"
            min="0"
            step="any"
          />
        </div>
      </div>

      <div class="field">
        <label for="entry_at">入场时间</label>
        <input id="entry_at" v-model="form.entry_at" type="datetime-local" required />
      </div>

      <template v-if="form.status === 'closed'">
        <div class="grid-2">
          <div class="field">
            <label for="exit_price">出场价</label>
            <input
              id="exit_price"
              v-model.number="form.exit_price"
              type="number"
              min="0"
              step="any"
              required
            />
          </div>
          <div class="field">
            <label for="exit_at">出场时间</label>
            <input
              id="exit_at"
              v-model="form.exit_at"
              type="datetime-local"
              required
            />
          </div>
        </div>
        <div class="field">
          <label>止盈/止损原因</label>
          <div class="reason-chip-list">
            <button
              v-for="item in exitReasons"
              :key="item.id"
              type="button"
              class="reason-tag reason-chip"
              :class="[
                `reason-tag--${item.reason_type}`,
                { 'reason-chip--active': String(form.exit_reason_id) === String(item.id) }
              ]"
              @click="form.exit_reason_id = String(item.id)"
            >
              {{ item.name }}
            </button>
          </div>
        </div>
      </template>

      <div class="field">
        <label for="notes">备注</label>
        <textarea id="notes" v-model.trim="form.notes" rows="3" />
      </div>

      <div class="form-actions">
        <button class="btn btn-primary" type="submit" :disabled="isSaving">
          {{ isSaving ? '保存中...' : '保存' }}
        </button>
        <RouterLink class="btn btn-secondary" to="/trades">返回</RouterLink>
      </div>
    </form>
  </section>
  <!-- E 交易表单 -->
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  apiCreateTrade,
  apiGetAccounts,
  apiGetExitReasons,
  apiGetStrategies,
  apiGetTrade,
  apiUpdateTrade
} from '@/api'
import {
  formatMarket,
  fromDateTimeLocal,
  toDateTimeLocal
} from '@/utils/format'

const route = useRoute()
const router = useRouter()

const accounts = ref([])
const strategies = ref([])
const exitReasons = ref([])
const errorMessage = ref('')
const isSaving = ref(false)

const isEdit = computed(() => Boolean(route.params.id))

const form = reactive({
  account_id: '',
  market: 'CN',
  symbol: '',
  direction: 'long',
  strategy_id: '',
  status: 'open',
  quantity: null,
  entry_price: null,
  exit_price: null,
  fee: 0,
  entry_at: '',
  exit_at: '',
  exit_reason_id: '',
  notes: ''
})

/**
 * @description 账户变更时同步市场
 * @returns {void}
 */
function handleAccountChange() {
  const account = accounts.value.find(
    (item) => String(item.id) === String(form.account_id)
  )
  if (account) {
    form.market = account.market
  }
}

/**
 * @description 加载下拉与编辑数据
 * @returns {Promise<void>}
 */
async function handleInit() {
  errorMessage.value = ''
  try {
    const [accountRes, strategyRes, reasonRes] = await Promise.all([
      apiGetAccounts(),
      apiGetStrategies(),
      apiGetExitReasons()
    ])
    accounts.value = accountRes.data
    strategies.value = strategyRes.data
    exitReasons.value = reasonRes.data

    if (!isEdit.value) {
      if (accounts.value.length) {
        form.account_id = String(accounts.value[0].id)
        form.market = accounts.value[0].market
      }
      const now = new Date()
      const pad = (num) => String(num).padStart(2, '0')
      form.entry_at = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
      return
    }

    const { data } = await apiGetTrade(route.params.id)
    form.account_id = String(data.account_id)
    form.market = data.market
    form.symbol = data.symbol
    form.direction = data.direction
    form.strategy_id = data.strategy_id ? String(data.strategy_id) : ''
    form.status = data.status
    form.quantity = data.quantity
    form.entry_price = data.entry_price
    form.exit_price = data.exit_price
    form.fee = data.fee
    form.entry_at = toDateTimeLocal(data.entry_at)
    form.exit_at = toDateTimeLocal(data.exit_at)
    form.exit_reason_id = data.exit_reason_id ? String(data.exit_reason_id) : ''
    form.notes = data.notes || ''
  } catch (error) {
    errorMessage.value = error.response?.data?.message || '加载失败'
  }
}

/**
 * @description 提交保存
 * @returns {Promise<void>}
 */
async function handleSubmit() {
  isSaving.value = true
  errorMessage.value = ''
  try {
    const payload = {
      account_id: Number(form.account_id),
      market: form.market,
      symbol: form.symbol,
      direction: form.direction,
      strategy_id: form.strategy_id ? Number(form.strategy_id) : null,
      status: form.status,
      quantity: Number(form.quantity),
      entry_price: Number(form.entry_price),
      fee: Number(form.fee || 0),
      entry_at: fromDateTimeLocal(form.entry_at),
      notes: form.notes,
      exit_price: form.status === 'closed' ? Number(form.exit_price) : null,
      exit_at: form.status === 'closed' ? fromDateTimeLocal(form.exit_at) : null,
      exit_reason_id:
        form.status === 'closed' && form.exit_reason_id
          ? Number(form.exit_reason_id)
          : null
    }

    if (isEdit.value) {
      await apiUpdateTrade(route.params.id, payload)
    } else {
      await apiCreateTrade(payload)
    }
    router.push('/trades')
  } catch (error) {
    errorMessage.value = error.response?.data?.message || '保存失败'
  } finally {
    isSaving.value = false
  }
}

onMounted(handleInit)
</script>

<style scoped>
.reason-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.reason-chip {
  border: 1px solid transparent;
  cursor: pointer;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
}

.reason-chip--active {
  border-color: currentColor;
  box-shadow: 0 0 0 1px currentColor;
}
</style>
