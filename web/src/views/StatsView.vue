/**
 * @file StatsView.vue
 * @description 盈亏与胜率统计页
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

<template>
  <!-- S 统计页 -->
  <section>
    <h2 class="page-title">复盘总览</h2>
    <p class="page-subtitle">按策略与账户查看盈亏、胜率，支持时间与市场筛选。</p>

    <div class="panel">
      <div class="grid-3">
        <div class="field">
          <label for="from">开始日期</label>
          <input id="from" v-model="filters.from" type="date" @change="handleLoad" />
        </div>
        <div class="field">
          <label for="to">结束日期</label>
          <input id="to" v-model="filters.to" type="date" @change="handleLoad" />
        </div>
        <div class="field">
          <label for="market">市场</label>
          <select id="market" v-model="filters.market" @change="handleLoad">
            <option value="">全部</option>
            <option value="CN">A股</option>
            <option value="US">美股</option>
          </select>
        </div>
      </div>
    </div>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <div v-if="stats" class="stat-grid" style="margin-top: 16px;">
      <div class="stat-card">
        <div class="label">总盈亏</div>
        <div
          class="value"
          :class="stats.overview.total_pnl >= 0 ? 'value-win' : 'value-loss'"
        >
          {{ formatMoney(stats.overview.total_pnl) }}
        </div>
      </div>
      <div class="stat-card">
        <div class="label">胜率</div>
        <div class="value">{{ formatPercent(stats.overview.win_rate) }}</div>
      </div>
      <div class="stat-card">
        <div class="label">已平仓 / 持仓中</div>
        <div class="value">
          {{ stats.overview.closed_count }} / {{ stats.overview.open_count }}
        </div>
      </div>
      <div class="stat-card">
        <div class="label">胜 / 负</div>
        <div class="value">
          {{ stats.overview.win_count }} / {{ stats.overview.loss_count }}
        </div>
      </div>
    </div>

    <div class="panel">
      <h3>按策略</h3>
      <div v-if="!stats?.by_strategy?.length" class="empty-state">暂无策略统计</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>策略</th>
              <th>笔数</th>
              <th>胜率</th>
              <th>总盈亏</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in stats.by_strategy" :key="item.strategy_id || 'none'">
              <td>{{ item.strategy_name }}</td>
              <td>{{ item.closed_count }}</td>
              <td>{{ formatPercent(item.win_rate) }}</td>
              <td :class="item.total_pnl >= 0 ? 'value-win' : 'value-loss'">
                {{ formatMoney(item.total_pnl) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="panel">
      <h3>按账户</h3>
      <div v-if="!stats?.by_account?.length" class="empty-state">暂无账户统计</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>账户</th>
              <th>市场</th>
              <th>胜率</th>
              <th>总盈亏</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in stats.by_account" :key="item.account_id">
              <td>{{ item.account_name }}</td>
              <td>{{ formatMarket(item.market) }}</td>
              <td>{{ formatPercent(item.win_rate) }}</td>
              <td :class="item.total_pnl >= 0 ? 'value-win' : 'value-loss'">
                {{ formatMoney(item.total_pnl, item.currency) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="panel">
      <h3>按离场原因</h3>
      <div v-if="!stats?.by_exit_reason?.length" class="empty-state">暂无原因统计</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>原因</th>
              <th>类型</th>
              <th>笔数</th>
              <th>总盈亏</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in stats.by_exit_reason"
              :key="item.exit_reason_id || 'none'"
            >
              <td>{{ item.exit_reason_name }}</td>
              <td>
                <BaseReasonTag :reason-type="item.exit_reason_type || 'other'" />
              </td>
              <td>{{ item.closed_count }}</td>
              <td :class="item.total_pnl >= 0 ? 'value-win' : 'value-loss'">
                {{ formatMoney(item.total_pnl) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
  <!-- E 统计页 -->
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { apiGetStats } from '@/api'
import BaseReasonTag from '@/components/BaseReasonTag.vue'
import {
  formatMarket,
  formatMoney,
  formatPercent
} from '@/utils/format'

const stats = ref(null)
const errorMessage = ref('')
const filters = reactive({
  from: '',
  to: '',
  market: ''
})

/**
 * @description 加载统计数据
 * @returns {Promise<void>}
 */
async function handleLoad() {
  errorMessage.value = ''
  try {
    const params = {}
    if (filters.from) {
      params.from = `${filters.from} 00:00:00`
    }
    if (filters.to) {
      params.to = `${filters.to} 23:59:59`
    }
    if (filters.market) {
      params.market = filters.market
    }
    const { data } = await apiGetStats(params)
    stats.value = data
  } catch (error) {
    errorMessage.value = error.response?.data?.message || '统计加载失败'
  }
}

onMounted(handleLoad)
</script>

<style scoped>
h3 {
  margin: 0 0 12px;
  font-size: 1.05rem;
  color: #f0f3fa;
}
</style>
