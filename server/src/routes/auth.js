/**
 * @file auth.js
 * @description 登录鉴权路由
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db/database.js'
import { JWT_SECRET } from '../middleware/auth.js'

const router = Router()

/**
 * @description 用户登录
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body || {}

  if (!username || !password) {
    res.status(400).json({ message: '请输入用户名和密码' })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ message: '用户名或密码错误' })
    return
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '30d' }
  )

  res.json({
    token,
    user: { id: user.id, username: user.username }
  })
})

/**
 * @description 获取当前登录用户
 */
router.get('/me', (req, res) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token) {
    res.status(401).json({ message: '未登录' })
    return
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    res.json({ id: payload.id, username: payload.username })
  } catch (error) {
    res.status(401).json({ message: '未登录' })
  }
})

export default router
