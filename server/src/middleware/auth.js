/**
 * @file auth.js
 * @description JWT 鉴权中间件
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'trade-journal-secret-change-me'

/**
 * @description 校验请求中的 Bearer Token
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token) {
    res.status(401).json({ message: '未登录或登录已过期' })
    return
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch (error) {
    res.status(401).json({ message: '未登录或登录已过期' })
  }
}

export { JWT_SECRET }
