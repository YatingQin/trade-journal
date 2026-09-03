/**
 * @file trades.js
 * @description 交易记录路由
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

import { Router } from 'express'
import db from '../db/database.js'
import { withPnl } from '../db/tradeHelper.js'

const router = Router()

const TRADE_SELECT = `
  SELECT
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
`

/**
 * @description 校验并规范化交易入参
 * @param {object} body
 * @param {boolean} isUpdate
 * @returns {{ ok: true, data: object } | { ok: false, message: string }}
 */
function normalizeTradeInput(body, isUpdate = false) {
  const data = {
    account_id: body.account_id != null ? Number(body.account_id) : null,
    strategy_id:
      body.strategy_id === '' || body.strategy_id == null
        ? null
        : Number(body.strategy_id),
    exit_reason_id:
      body.exit_reason_id === '' || body.exit_reason_id == null
        ? null
        : Number(body.exit_reason_id),
    symbol: body.symbol != null ? String(body.symbol).trim().toUpperCase() : null,
    market: body.market || null,
    direction: body.direction || null,
    quantity: body.quantity != null ? Number(body.quantity) : null,
    entry_price: body.entry_price != null ? Number(body.entry_price) : null,
    exit_price:
      body.exit_price === '' || body.exit_price == null
        ? null
        : Number(body.exit_price),
    fee: body.fee != null ? Number(body.fee) : 0,
    entry_at: body.entry_at || null,
    exit_at: body.exit_at || null,
    status: body.status || null,
    notes: body.notes != null ? String(body.notes) : ''
  }

  if (!isUpdate) {
    if (!data.account_id || !data.symbol || !data.market || !data.direction) {
      return { ok: false, message: '请完整填写账户、标的、市场与方向' }
    }
    if (!['CN', 'US'].includes(data.market)) {
      return { ok: false, message: '市场仅支持 CN 或 US' }
    }
    if (!['long', 'short'].includes(data.direction)) {
      return { ok: false, message: '方向仅支持 long 或 short' }
    }
    if (!(data.quantity > 0) || !(data.entry_price > 0) || !data.entry_at) {
      return { ok: false, message: '请填写有效的数量、入场价与入场时间' }
    }
  }

  if (data.status === 'closed') {
    if (!(data.exit_price > 0) || !data.exit_at) {
      return { ok: false, message: '平仓交易需填写出场价与出场时间' }
    }
  }

  if (data.status === 'open') {
    data.exit_price = null
    data.exit_at = null
    data.exit_reason_id = null
  }

  return { ok: true, data }
}

/**
 * @description 获取交易列表
 */
router.get('/', (req, res) => {
  const {
    account_id: accountId,
    strategy_id: strategyId,
    market,
    status,
    symbol
  } = req.query

  const conditions = []
  const params = []

  if (accountId) {
    conditions.push('t.account_id = ?')
    params.push(Number(accountId))
  }
  if (strategyId) {
    conditions.push('t.strategy_id = ?')
    params.push(Number(strategyId))
  }
  if (market) {
    conditions.push('t.market = ?')
    params.push(market)
  }
  if (status) {
    conditions.push('t.status = ?')
    params.push(status)
  }
  if (symbol) {
    conditions.push('t.symbol LIKE ?')
    params.push(`%${String(symbol).trim().toUpperCase()}%`)
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db
    .prepare(
      `${TRADE_SELECT} ${whereSql} ORDER BY t.entry_at DESC, t.id DESC`
    )
    .all(...params)
    .map(withPnl)

  res.json(rows)
})

/**
 * @description 获取单笔交易
 */
router.get('/:id', (req, res) => {
  const row = db
    .prepare(`${TRADE_SELECT} WHERE t.id = ?`)
    .get(Number(req.params.id))

  if (!row) {
    res.status(404).json({ message: '交易不存在' })
    return
  }

  res.json(withPnl(row))
})

/**
 * @description 新增交易
 */
router.post('/', (req, res) => {
  const normalized = normalizeTradeInput(req.body, false)
  if (!normalized.ok) {
    res.status(400).json({ message: normalized.message })
    return
  }

  const data = normalized.data
  const account = db
    .prepare('SELECT * FROM accounts WHERE id = ?')
    .get(data.account_id)
  if (!account) {
    res.status(400).json({ message: '账户不存在' })
    return
  }

  if (data.market !== account.market) {
    res.status(400).json({ message: '交易市场需与账户市场一致' })
    return
  }

  const status =
    data.status ||
    (data.exit_price != null && data.exit_at ? 'closed' : 'open')

  if (status === 'closed' && (!(data.exit_price > 0) || !data.exit_at)) {
    res.status(400).json({ message: '平仓交易需填写出场价与出场时间' })
    return
  }

  const result = db
    .prepare(
      `INSERT INTO trades (
        account_id, strategy_id, exit_reason_id, symbol, market, direction,
        quantity, entry_price, exit_price, fee, entry_at, exit_at, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.account_id,
      data.strategy_id,
      status === 'closed' ? data.exit_reason_id : null,
      data.symbol,
      data.market,
      data.direction,
      data.quantity,
      data.entry_price,
      status === 'closed' ? data.exit_price : null,
      data.fee || 0,
      data.entry_at,
      status === 'closed' ? data.exit_at : null,
      status,
      data.notes || ''
    )

  const row = db
    .prepare(`${TRADE_SELECT} WHERE t.id = ?`)
    .get(result.lastInsertRowid)
  res.status(201).json(withPnl(row))
})

/**
 * @description 更新交易
 */
router.put('/:id', (req, res) => {
  const id = Number(req.params.id)
  const existing = db.prepare('SELECT * FROM trades WHERE id = ?').get(id)
  if (!existing) {
    res.status(404).json({ message: '交易不存在' })
    return
  }

  const merged = {
    ...existing,
    ...req.body,
    account_id: req.body.account_id ?? existing.account_id,
    strategy_id:
      req.body.strategy_id !== undefined
        ? req.body.strategy_id
        : existing.strategy_id,
    exit_reason_id:
      req.body.exit_reason_id !== undefined
        ? req.body.exit_reason_id
        : existing.exit_reason_id
  }

  const normalized = normalizeTradeInput(merged, true)
  if (!normalized.ok) {
    res.status(400).json({ message: normalized.message })
    return
  }

  const data = normalized.data
  const status =
    data.status ||
    (data.exit_price != null && data.exit_at ? 'closed' : existing.status)

  if (status === 'closed' && (!(data.exit_price > 0) || !data.exit_at)) {
    res.status(400).json({ message: '平仓交易需填写出场价与出场时间' })
    return
  }

  const accountId = data.account_id || existing.account_id
  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(accountId)
  if (!account) {
    res.status(400).json({ message: '账户不存在' })
    return
  }

  const market = data.market || existing.market
  if (market !== account.market) {
    res.status(400).json({ message: '交易市场需与账户市场一致' })
    return
  }

  db.prepare(
    `UPDATE trades SET
      account_id = ?, strategy_id = ?, exit_reason_id = ?, symbol = ?, market = ?,
      direction = ?, quantity = ?, entry_price = ?, exit_price = ?, fee = ?,
      entry_at = ?, exit_at = ?, status = ?, notes = ?,
      updated_at = datetime('now', 'localtime')
     WHERE id = ?`
  ).run(
    accountId,
    data.strategy_id,
    status === 'closed' ? data.exit_reason_id : null,
    data.symbol || existing.symbol,
    market,
    data.direction || existing.direction,
    data.quantity != null ? data.quantity : existing.quantity,
    data.entry_price != null ? data.entry_price : existing.entry_price,
    status === 'closed' ? data.exit_price : null,
    data.fee != null ? data.fee : existing.fee,
    data.entry_at || existing.entry_at,
    status === 'closed' ? data.exit_at : null,
    status,
    data.notes != null ? data.notes : existing.notes,
    id
  )

  const row = db.prepare(`${TRADE_SELECT} WHERE t.id = ?`).get(id)
  res.json(withPnl(row))
})

/**
 * @description 删除交易
 */
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id)
  db.prepare('DELETE FROM trades WHERE id = ?').run(id)
  res.json({ success: true })
})

export default router
