/**
 * @file tradeHelper.js
 * @description 交易盈亏计算辅助方法
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

/**
 * @description 计算单笔已平仓交易盈亏
 * @param {{ direction: string, quantity: number, entry_price: number, exit_price: number|null, fee: number, status: string }} trade
 * @returns {number|null}
 */
export function calcPnl(trade) {
  if (trade.status !== 'closed' || trade.exit_price == null) {
    return null
  }

  const quantity = Number(trade.quantity)
  const entryPrice = Number(trade.entry_price)
  const exitPrice = Number(trade.exit_price)
  const fee = Number(trade.fee || 0)

  if (trade.direction === 'long') {
    return (exitPrice - entryPrice) * quantity - fee
  }

  return (entryPrice - exitPrice) * quantity - fee
}

/**
 * @description 计算收益率（不含手续费占比，按本金估算）
 * @param {{ direction: string, quantity: number, entry_price: number, exit_price: number|null, status: string }} trade
 * @returns {number|null}
 */
export function calcPnlPercent(trade) {
  if (trade.status !== 'closed' || trade.exit_price == null) {
    return null
  }

  const quantity = Number(trade.quantity)
  const entryPrice = Number(trade.entry_price)
  const notional = entryPrice * quantity
  if (notional === 0) {
    return null
  }

  const pnl = calcPnl({ ...trade, fee: 0 })
  return (pnl / notional) * 100
}

/**
 * @description 为交易对象附加盈亏字段
 * @param {object} trade
 * @returns {object}
 */
export function withPnl(trade) {
  const pnl = calcPnl(trade)
  const pnlPercent = calcPnlPercent(trade)
  return {
    ...trade,
    pnl,
    pnl_percent: pnlPercent,
    is_win: pnl == null ? null : pnl > 0
  }
}
