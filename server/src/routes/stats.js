/**
 * @file stats.js
 * @description 盈亏与胜率统计路由（分币种账户 + CNY 汇总 + 收益曲线）
 * @author QYT
 * @date 2026-09-04
 * @version 3.0.0
 */

import { Router } from 'express'
import { query } from '../db/database.js'
import { withPnl } from '../db/tradeHelper.js'
import { getUsdCnyRate, toCny } from '../db/fxHelper.js'

const router = Router()

/**
 * @description 汇总一组交易的统计指标（同币种场景）
 * @param {Array<object>} trades
 * @returns {object}
 */
function summarize(trades) {
  const closed = trades.filter((item) => String(item.status) === 'closed')
  const withMetrics = closed.map(withPnl)
  const wins = withMetrics.filter((item) => item.is_win === true)
  const losses = withMetrics.filter((item) => item.is_win === false)
  const totalPnl = withMetrics.reduce((sum, item) => sum + (item.pnl || 0), 0)

  return {
    trade_count: trades.length,
    closed_count: closed.length,
    open_count: trades.length - closed.length,
    win_count: wins.length,
    loss_count: losses.length,
    win_rate: closed.length
      ? Number(((wins.length / closed.length) * 100).toFixed(2))
      : null,
    total_pnl: Number(totalPnl.toFixed(4)),
    avg_pnl: closed.length
      ? Number((totalPnl / closed.length).toFixed(4))
      : null
  }
}

/**
 * @description 取平仓时间（优先出场时间）
 * @param {object} trade
 * @returns {string}
 */
function getCloseTime(trade) {
  return trade.exit_at || trade.entry_at || ''
}

/**
 * @description 格式化为日期键 YYYY-MM-DD
 * @param {string|Date} value
 * @returns {string}
 */
function toDateKey(value) {
  if (!value) {
    return ''
  }
  const text = String(value).replace('T', ' ')
  return text.slice(0, 10)
}

/**
 * @description 构建累计收益曲线
 * @param {Array<object>} closedTrades 已带 pnl 的平仓交易
 * @param {(trade: object) => number} getAmount 取当日盈亏金额
 * @returns {Array<{ date: string, pnl: number, cumulative_pnl: number }>}
 */
function buildCurve(closedTrades, getAmount) {
  const sorted = [...closedTrades].sort((a, b) => {
    const left = getCloseTime(a)
    const right = getCloseTime(b)
    return left.localeCompare(right)
  })

  const dailyMap = new Map()
  for (const trade of sorted) {
    const dateKey = toDateKey(getCloseTime(trade))
    if (!dateKey) {
      continue
    }
    const amount = Number(getAmount(trade) || 0)
    dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + amount)
  }

  let cumulative = 0
  const points = []
  for (const [date, pnl] of [...dailyMap.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    cumulative += pnl
    points.push({
      date,
      pnl: Number(pnl.toFixed(4)),
      cumulative_pnl: Number(cumulative.toFixed(4))
    })
  }
  return points
}

/**
 * @description 获取总体 / 按策略 / 按账户统计与收益曲线
 */
router.get('/', async (req, res, next) => {
  try {
    const { from, to, market } = req.query
    const conditions = []
    const params = []
    const usdCnyRate = getUsdCnyRate()

    if (from) {
      params.push(from)
      conditions.push(`t.entry_at >= $${params.length}`)
    }
    if (to) {
      params.push(to)
      conditions.push(`t.entry_at <= $${params.length}`)
    }
    if (market) {
      params.push(market)
      conditions.push(`t.market = $${params.length}`)
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const { rows: trades } = await query(
      `SELECT
        t.*,
        a.name AS account_name,
        a.currency AS account_currency,
        s.name AS strategy_name,
        er.name AS exit_reason_name,
        er.reason_type AS exit_reason_type
      FROM trades t
      LEFT JOIN accounts a ON a.id = t.account_id
      LEFT JOIN strategies s ON s.id = t.strategy_id
      LEFT JOIN exit_reasons er ON er.id = t.exit_reason_id
      ${whereSql}
      ORDER BY t.entry_at DESC`,
      params
    )

    const enriched = trades.map((trade) => {
      const withMetrics = withPnl(trade)
      const currency = trade.account_currency || (trade.market === 'US' ? 'USD' : 'CNY')
      const pnl = withMetrics.pnl
      const pnlCny =
        pnl == null ? null : Number(toCny(pnl, currency, usdCnyRate).toFixed(4))
      return {
        ...withMetrics,
        account_currency: currency,
        pnl_cny: pnlCny
      }
    })

    const byStrategyMap = new Map()
    const byAccountMap = new Map()

    for (const trade of enriched) {
      const strategyKey = trade.strategy_id || 0
      const strategyName = trade.strategy_name || '未关联策略'
      if (!byStrategyMap.has(strategyKey)) {
        byStrategyMap.set(strategyKey, {
          strategy_id: trade.strategy_id,
          strategy_name: strategyName,
          trades: []
        })
      }
      byStrategyMap.get(strategyKey).trades.push(trade)

      const accountKey = trade.account_id
      if (!byAccountMap.has(accountKey)) {
        byAccountMap.set(accountKey, {
          account_id: trade.account_id,
          account_name: trade.account_name,
          market: trade.market,
          currency: trade.account_currency,
          trades: []
        })
      }
      byAccountMap.get(accountKey).trades.push(trade)
    }

    const byStrategy = Array.from(byStrategyMap.values()).map((group) => {
      const summary = summarize(group.trades)
      const closed = group.trades.filter((item) => String(item.status) === 'closed')
      const totalPnlCny = closed.reduce(
        (sum, item) => sum + (item.pnl_cny || 0),
        0
      )
      const currencies = [...new Set(closed.map((item) => item.account_currency))]
      return {
        strategy_id: group.strategy_id,
        strategy_name: group.strategy_name,
        ...summary,
        currency: currencies.length === 1 ? currencies[0] : 'MIXED',
        total_pnl_cny: Number(totalPnlCny.toFixed(4))
      }
    })

    const byAccount = Array.from(byAccountMap.values()).map((group) => {
      const summary = summarize(group.trades)
      const closed = group.trades.filter((item) => String(item.status) === 'closed')
      const totalPnlCny = closed.reduce(
        (sum, item) => sum + (item.pnl_cny || 0),
        0
      )
      return {
        account_id: group.account_id,
        account_name: group.account_name,
        market: group.market,
        currency: group.currency,
        ...summary,
        total_pnl_cny: Number(totalPnlCny.toFixed(4)),
        curve: buildCurve(closed, (trade) => trade.pnl || 0)
      }
    })

    const byExitReasonMap = new Map()
    for (const trade of enriched.filter((item) => String(item.status) === 'closed')) {
      const key = trade.exit_reason_id || 0
      if (!byExitReasonMap.has(key)) {
        byExitReasonMap.set(key, {
          exit_reason_id: trade.exit_reason_id,
          exit_reason_name: trade.exit_reason_name || '未填写原因',
          exit_reason_type: trade.exit_reason_type || 'other',
          trades: []
        })
      }
      byExitReasonMap.get(key).trades.push(trade)
    }

    const byExitReason = Array.from(byExitReasonMap.values()).map((group) => {
      const summary = summarize(group.trades)
      const totalPnlCny = group.trades.reduce(
        (sum, item) => sum + (item.pnl_cny || 0),
        0
      )
      const currencies = [
        ...new Set(group.trades.map((item) => item.account_currency))
      ]
      return {
        exit_reason_id: group.exit_reason_id,
        exit_reason_name: group.exit_reason_name,
        exit_reason_type: group.exit_reason_type,
        ...summary,
        currency: currencies.length === 1 ? currencies[0] : 'MIXED',
        total_pnl_cny: Number(totalPnlCny.toFixed(4))
      }
    })

    const closedAll = enriched.filter((item) => String(item.status) === 'closed')
    const overviewBase = summarize(enriched)
    const totalPnlCny = closedAll.reduce(
      (sum, item) => sum + (item.pnl_cny || 0),
      0
    )

    res.json({
      fx: {
        usd_cny: usdCnyRate,
        base_currency: 'CNY'
      },
      overview: {
        ...overviewBase,
        // 总盈亏统一为折合人民币，避免跨币种直接相加
        total_pnl: Number(totalPnlCny.toFixed(4)),
        total_pnl_cny: Number(totalPnlCny.toFixed(4)),
        currency: 'CNY'
      },
      by_strategy: byStrategy,
      by_account: byAccount,
      by_exit_reason: byExitReason,
      curves: {
        by_account: byAccount.map((item) => ({
          account_id: item.account_id,
          account_name: item.account_name,
          currency: item.currency,
          points: item.curve
        })),
        total_cny: buildCurve(closedAll, (trade) => trade.pnl_cny || 0)
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
