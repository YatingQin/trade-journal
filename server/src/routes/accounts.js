/**
 * @file accounts.js
 * @description 交易账户路由
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

import { Router } from 'express'
import db from '../db/database.js'

const router = Router()

const MARKET_CURRENCY = {
  CN: 'CNY',
  US: 'USD'
}

/**
 * @description 获取账户列表
 */
router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM accounts ORDER BY id ASC')
    .all()
  res.json(rows)
})

/**
 * @description 新增账户
 */
router.post('/', (req, res) => {
  const { name, market, note = '' } = req.body || {}

  if (!name || !market || !MARKET_CURRENCY[market]) {
    res.status(400).json({ message: '请填写账户名称并选择市场（CN/US）' })
    return
  }

  const result = db
    .prepare(
      'INSERT INTO accounts (name, market, currency, note) VALUES (?, ?, ?, ?)'
    )
    .run(name.trim(), market, MARKET_CURRENCY[market], note)

  const row = db.prepare('SELECT * FROM accounts WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(row)
})

/**
 * @description 更新账户
 */
router.put('/:id', (req, res) => {
  const id = Number(req.params.id)
  const existing = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id)
  if (!existing) {
    res.status(404).json({ message: '账户不存在' })
    return
  }

  const name = req.body.name ?? existing.name
  const market = req.body.market ?? existing.market
  const note = req.body.note ?? existing.note

  if (!MARKET_CURRENCY[market]) {
    res.status(400).json({ message: '市场仅支持 CN 或 US' })
    return
  }

  db.prepare(
    'UPDATE accounts SET name = ?, market = ?, currency = ?, note = ? WHERE id = ?'
  ).run(name.trim(), market, MARKET_CURRENCY[market], note, id)

  const row = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id)
  res.json(row)
})

/**
 * @description 删除账户
 */
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id)
  const tradeCount = db
    .prepare('SELECT COUNT(*) AS count FROM trades WHERE account_id = ?')
    .get(id).count

  if (tradeCount > 0) {
    res.status(400).json({ message: '该账户下仍有交易记录，无法删除' })
    return
  }

  db.prepare('DELETE FROM accounts WHERE id = ?').run(id)
  res.json({ success: true })
})

export default router
