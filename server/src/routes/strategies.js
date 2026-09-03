/**
 * @file strategies.js
 * @description 交易策略路由
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

import { Router } from 'express'
import db from '../db/database.js'

const router = Router()

/**
 * @description 获取策略列表
 */
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM strategies ORDER BY id ASC').all()
  res.json(rows)
})

/**
 * @description 新增策略
 */
router.post('/', (req, res) => {
  const { name, description = '' } = req.body || {}

  if (!name || !String(name).trim()) {
    res.status(400).json({ message: '请填写策略名称' })
    return
  }

  try {
    const result = db
      .prepare('INSERT INTO strategies (name, description) VALUES (?, ?)')
      .run(String(name).trim(), description)
    const row = db
      .prepare('SELECT * FROM strategies WHERE id = ?')
      .get(result.lastInsertRowid)
    res.status(201).json(row)
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      res.status(400).json({ message: '策略名称已存在' })
      return
    }
    throw error
  }
})

/**
 * @description 更新策略
 */
router.put('/:id', (req, res) => {
  const id = Number(req.params.id)
  const existing = db.prepare('SELECT * FROM strategies WHERE id = ?').get(id)
  if (!existing) {
    res.status(404).json({ message: '策略不存在' })
    return
  }

  const name = req.body.name ?? existing.name
  const description = req.body.description ?? existing.description

  try {
    db.prepare('UPDATE strategies SET name = ?, description = ? WHERE id = ?').run(
      String(name).trim(),
      description,
      id
    )
    const row = db.prepare('SELECT * FROM strategies WHERE id = ?').get(id)
    res.json(row)
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      res.status(400).json({ message: '策略名称已存在' })
      return
    }
    throw error
  }
})

/**
 * @description 删除策略
 */
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id)
  const tradeCount = db
    .prepare('SELECT COUNT(*) AS count FROM trades WHERE strategy_id = ?')
    .get(id).count

  if (tradeCount > 0) {
    res.status(400).json({ message: '该策略仍被交易引用，无法删除' })
    return
  }

  db.prepare('DELETE FROM strategies WHERE id = ?').run(id)
  res.json({ success: true })
})

export default router
