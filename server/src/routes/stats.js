/**
 * @file stats.js
 * @description 盈亏与胜率统计路由
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

import { Router } from 'express'
import db from '../db/database.js'
import { withPnl } from '../db/tradeHelper.js'

const router = Router()

/**
 * @description 汇总一组交易的统计指标
 * @param {Array<object>} trades
 * @returns {object}
 */
function summarize(trades) {
  const closed = trades.filter((item) => item.status === 'closed')
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
 * @description 获取总体 / 按策略 / 按账户统计
 */
router.get('/', (req, res) => {
  const { from, to, market } = req.query
  const conditions = []
  const params = []

  if (from) {
    conditions.push('t.entry_at >= ?')
    params.push(from)
  }
  if (to) {
    conditions.push('t.entry_at <= ?')
    params.push(to)
  }
  if (market) {
    conditions.push('t.market = ?')
    params.push(market)
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const trades = db
    .prepare(
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
      ORDER BY t.entry_at DESC`
    )
    .all(...params)

  const byStrategyMap = new Map()
  const byAccountMap = new Map()

  for (const trade of trades) {
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

  const byStrategy = Array.from(byStrategyMap.values()).map((group) => ({
    strategy_id: group.strategy_id,
    strategy_name: group.strategy_name,
    ...summarize(group.trades)
  }))

  const byAccount = Array.from(byAccountMap.values()).map((group) => ({
    account_id: group.account_id,
    account_name: group.account_name,
    market: group.market,
    currency: group.currency,
    ...summarize(group.trades)
  }))

  const byExitReasonMap = new Map()
  for (const trade of trades.filter((item) => item.status === 'closed')) {
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

  const byExitReason = Array.from(byExitReasonMap.values()).map((group) => ({
    exit_reason_id: group.exit_reason_id,
    exit_reason_name: group.exit_reason_name,
    exit_reason_type: group.exit_reason_type,
    ...summarize(group.trades)
  }))

  res.json({
    overview: summarize(trades),
    by_strategy: byStrategy,
    by_account: byAccount,
    by_exit_reason: byExitReason
  })
})

export default router
