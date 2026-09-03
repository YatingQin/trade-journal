/**
 * @file TradesView.vue
 * @description 交易列表页
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */
<template>
  <section>
    <div class="page-head">
      <div>
        <h2 class="page-title">交易记录</h2>
        <p class="page-subtitle">手工录入每笔交易，关联策略与离场原因。</p>
      </div>
      <RouterLink class="btn btn-primary" to="/trades/new">新增交易</RouterLink>
    </div>
    <div class="panel">
      <div class="grid-2">
        <div class="field"><label for="symbol">标的</label><input id="symbol" v-model.trim="filters.symbol" placeholder="如 600519 / AAPL" @keyup.enter="handleLoad" /></div>
        <div class="field"><label for="status">状态</label><select id="status" v-model="filters.status" @change="handleLoad"><option value="">全部</option><option value="open">持仓中</option><option value="closed">已平仓</option></select></div>
        <div class="field"><label for="market">市场</label><select id="market" v-model="filters.market" @change="handleLoad"><option value="">全部</option><option value="CN">A股</option><option value="US">美股</option></select></div>
        <div class="field"><label for="strategy">策略</label><select id="strategy" v-model="filters.strategy_id" @change="handleLoad"><option value="">全部</option><option v-for="item in strategies" :key="item.id" :value="String(item.id)">{{ item.name }}</option></select></div>
      </div>
      <button class="btn btn-secondary" type="button" @click="handleLoad">查询</button>
    </div>
    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
    <div class="panel">
      <div v-if="!trades.length" class="empty-state">还没有交易，先记一笔吧。</div>
      <div v-else class="trade-list">
        <article v-for="trade in trades" :key="trade.id" class="trade-item">
          <div class="trade-item__main">
            <div class="trade-item__title">
              <strong>{{ trade.symbol }}</strong>
              <span class="tag">{{ formatMarket(trade.market) }}</span>
              <span class="tag">{{ formatDirection(trade.direction) }}</span>
              <span class="tag" :class="trade.status === 'open' ? 'tag-open' : (trade.is_win ? 'tag-win' : 'tag-loss')">{{ trade.status === 'open' ? '持仓中' : (trade.is_win ? '盈利' : '亏损') }}</span>
            </div>
            <p>{{ trade.account_name }} · {{ trade.strategy_name || '未关联策略' }}</p>
            <p>入场 {{ formatMoney(trade.entry_price) }}<template v-if="trade.status === 'closed'"> → 出场 {{ formatMoney(trade.exit_price) }}</template> · 数量 {{ trade.quantity }}</p>
            <p v-if="trade.status === 'closed'">盈亏 <strong :class="trade.pnl >= 0 ? 'value-win' : 'value-loss'">{{ formatMoney(trade.pnl, trade.account_currency) }}</strong> · <BaseReasonTag v-if="trade.exit_reason_name" :reason-type="trade.exit_reason_type || 'other'" :label="trade.exit_reason_name" /><span v-else class="tag">未填原因</span></p>
          </div>
          <div class="inline-actions">
            <RouterLink class="btn btn-secondary" :to="`/trades/${trade.id}/edit`">编辑</RouterLink>
            <button class="btn btn-danger" type="button" @click="handleDelete(trade.id)">删除</button>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue'
import { apiDeleteTrade, apiGetStrategies, apiGetTrades } from '@/api'
import BaseReasonTag from '@/components/BaseReasonTag.vue'
import { formatDirection, formatMarket, formatMoney } from '@/utils/format'
const trades = ref([])
const strategies = ref([])
const errorMessage = ref('')
const filters = reactive({ symbol: '', status: '', market: '', strategy_id: '' })
async function handleLoad() {
  errorMessage.value = ''
  try {
    const params = {}
    if (filters.symbol) params.symbol = filters.symbol
    if (filters.status) params.status = filters.status
    if (filters.market) params.market = filters.market
    if (filters.strategy_id) params.strategy_id = filters.strategy_id
    const [tradeRes, strategyRes] = await Promise.all([apiGetTrades(params), apiGetStrategies()])
    trades.value = tradeRes.data
    strategies.value = strategyRes.data
  } catch (e) { errorMessage.value = e.response?.data?.message || '交易列表加载失败' }
}
async function handleDelete(id) {
  if (!window.confirm('确认删除这笔交易？')) return
  try { await apiDeleteTrade(id); await handleLoad() } catch (e) { errorMessage.value = e.response?.data?.message || '删除失败' }
}
onMounted(handleLoad)
</script>
<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px; }
.trade-item { display: flex; justify-content: space-between; gap: 12px; padding: 16px 0; border-bottom: 1px solid var(--color-border); }
.trade-item:last-child { border-bottom: none; }
.trade-item__title { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 8px; }
.trade-item p { margin: 0 0 4px; color: var(--color-muted); font-size: 0.92rem; }
@media (max-width: 768px) { .page-head { flex-direction: column; } .trade-item { flex-direction: column; } }
</style>