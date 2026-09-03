/**
 * @file exitReasons.js
 * @description 止盈止损原因路由
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

import { Router } from 'express'
import db from '../db/database.js'

const router = Router()
const VALID_TYPES = ['take_profit', 'stop_loss', 'other']

/**
 * @description 获取原因列表
 */
router.get('/', (req, res) => {
  const { reason_type: reasonType } = req.query
  let rows

  if (reasonType) {
    rows = db
      .prepare(
        'SELECT * FROM exit_reasons WHERE reason_type = ? ORDER BY id ASC'
      )
      .all(reasonType)
  } else {
    rows = db.prepare('SELECT * FROM exit_reasons ORDER BY id ASC').all()
  }

  res.json(rows)
})

/**
 * @description 新增原因
 */
router.post('/', (req, res) => {
  const { name, reason_type: reasonType } = req.body || {}

  if (!name || !VALID_TYPES.includes(reasonType)) {
    res.status(400).json({
      message: '请填写原因名称，并选择类型：take_profit / stop_loss / other'
    })
    return
  }

  try {
    const result = db
      .prepare('INSERT INTO exit_reasons (name, reason_type) VALUES (?, ?)')
      .run(String(name).trim(), reasonType)
    const row = db
      .prepare('SELECT * FROM exit_reasons WHERE id = ?')
      .get(result.lastInsertRowid)
    res.status(201).json(row)
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      res.status(400).json({ message: '原因名称已存在' })
      return
    }
    throw error
  }
})

/**
 * @description 更新原因
 */
router.put('/:id', (req, res) => {
  const id = Number(req.params.id)
  const existing = db.prepare('SELECT * FROM exit_reasons WHERE id = ?').get(id)
  if (!existing) {
    res.status(404).json({ message: '原因不存在' })
    return
  }

  const name = req.body.name ?? existing.name
  const reasonType = req.body.reason_type ?? existing.reason_type

  if (!VALID_TYPES.includes(reasonType)) {
    res.status(400).json({ message: '原因类型无效' })
    return
  }

  try {
    db.prepare(
      'UPDATE exit_reasons SET name = ?, reason_type = ? WHERE id = ?'
    ).run(String(name).trim(), reasonType, id)
    const row = db.prepare('SELECT * FROM exit_reasons WHERE id = ?').get(id)
    res.json(row)
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      res.status(400).json({ message: '原因名称已存在' })
      return
    }
    throw error
  }
})

/**
 * @description 删除原因
 */
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id)
  const tradeCount = db
    .prepare('SELECT COUNT(*) AS count FROM trades WHERE exit_reason_id = ?')
    .get(id).count

  if (tradeCount > 0) {
    res.status(400).json({ message: '该原因仍被交易引用，无法删除' })
    return
  }

  db.prepare('DELETE FROM exit_reasons WHERE id = ?').run(id)
  res.json({ success: true })
})

export default router
