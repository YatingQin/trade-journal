/**
 * @file StatsView.vue
 * @description 盈亏与胜率统计页（分账户币种 + CNY 汇总 + 收益曲线）
 * @author QYT
 * @date 2026-09-04
 * @version 2.0.0
 */

<template>
  <!-- S 统计页 -->
  <section>
    <h2 class="page-title">复盘总览</h2>
    <p class="page-subtitle">
      各账户按本币统计；总盈亏统一折合 CNY（USD/CNY={{ stats?.fx?.usd_cny ?? '-' }}）。
    </p>

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

    <template v-if="stats">
      <!-- S 账户本币盈亏 -->
      <div class="stat-grid account-grid">
        <div
          v-for="item in stats.by_account"
          :key="item.account_id"
          class="stat-card"
        >
          <div class="label">{{ item.account_name }}盈亏</div>
          <div
            class="value"
            :class="item.total_pnl >= 0 ? 'value-win' : 'value-loss'"
          >
            {{ formatMoney(item.total_pnl, item.currency) }}
          </div>
          <p class="card-sub">
            折合 {{ formatMoney(item.total_pnl_cny, 'CNY') }} · 胜率
            {{ formatPercent(item.win_rate) }}
          </p>
        </div>
        <div class="stat-card stat-card--total">
          <div class="label">总盈亏（折合 CNY）</div>
          <div
            class="value"
            :class="stats.overview.total_pnl_cny >= 0 ? 'value-win' : 'value-loss'"
          >
            {{ formatMoney(stats.overview.total_pnl_cny, 'CNY') }}
          </div>
          <p class="card-sub">
            已平仓 {{ stats.overview.closed_count }} · 胜率
            {{ formatPercent(stats.overview.win_rate) }}
          </p>
        </div>
      </div>
      <!-- E 账户本币盈亏 -->

      <!-- S 收益曲线 -->
      <div class="panel">
        <h3>总收益曲线（CNY）</h3>
        <BasePnlChart
          title="累计盈亏 CNY"
          unit="CNY"
          color="#2962ff"
          :points="stats.curves?.total_cny || []"
        />
      </div>

      <div
        v-for="curve in stats.curves?.by_account || []"
        :key="curve.account_id"
        class="panel"
      >
        <h3>{{ curve.account_name }}收益曲线（{{ curve.currency }}）</h3>
        <BasePnlChart
          :title="`累计盈亏 ${curve.currency}`"
          :unit="curve.currency"
          :color="curve.currency === 'USD' ? '#ff9800' : '#089981'"
          :points="curve.points || []"
        />
      </div>
      <!-- E 收益曲线 -->

      <div class="panel">
        <h3>按策略</h3>
        <div v-if="!stats.by_strategy?.length" class="empty-state">暂无策略统计</div>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>策略</th>
                <th>笔数</th>
                <th>胜率</th>
                <th>盈亏（本币/混合）</th>
                <th>盈亏（CNY）</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in stats.by_strategy"
                :key="item.strategy_id || 'none'"
              >
                <td>{{ item.strategy_name }}</td>
                <td>{{ item.closed_count }}</td>
                <td>{{ formatPercent(item.win_rate) }}</td>
                <td :class="item.total_pnl >= 0 ? 'value-win' : 'value-loss'">
                  <template v-if="item.currency === 'MIXED'">
                    跨币种（见 CNY）
                  </template>
                  <template v-else>
                    {{ formatMoney(item.total_pnl, item.currency) }}
                  </template>
                </td>
                <td :class="item.total_pnl_cny >= 0 ? 'value-win' : 'value-loss'">
                  {{ formatMoney(item.total_pnl_cny, 'CNY') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <h3>按账户</h3>
        <div v-if="!stats.by_account?.length" class="empty-state">暂无账户统计</div>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>账户</th>
                <th>市场</th>
                <th>胜率</th>
                <th>盈亏（本币）</th>
                <th>盈亏（CNY）</th>
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
                <td :class="item.total_pnl_cny >= 0 ? 'value-win' : 'value-loss'">
                  {{ formatMoney(item.total_pnl_cny, 'CNY') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <h3>按离场原因</h3>
        <div v-if="!stats.by_exit_reason?.length" class="empty-state">暂无原因统计</div>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>原因</th>
                <th>类型</th>
                <th>笔数</th>
                <th>盈亏（CNY）</th>
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
                <td :class="item.total_pnl_cny >= 0 ? 'value-win' : 'value-loss'">
                  {{ formatMoney(item.total_pnl_cny, 'CNY') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </section>
  <!-- E 统计页 -->
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { apiGetStats } from '@/api'
import BasePnlChart from '@/components/BasePnlChart.vue'
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

.account-grid {
  margin-top: 16px;
  margin-bottom: 16px;
}

.card-sub {
  margin: 8px 0 0;
  color: var(--color-muted);
  font-size: 0.82rem;
}

.stat-card--total {
  border-color: rgba(41, 98, 255, 0.45);
  background: linear-gradient(
    160deg,
    rgba(41, 98, 255, 0.16),
    rgba(30, 34, 45, 0.95)
  );
}
</style>
