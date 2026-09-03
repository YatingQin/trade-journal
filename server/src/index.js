/**
 * @file index.js
 * @description 交易复盘 API 服务入口
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { requireAuth } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import accountRoutes from './routes/accounts.js'
import strategyRoutes from './routes/strategies.js'
import exitReasonRoutes from './routes/exitReasons.js'
import tradeRoutes from './routes/trades.js'
import statsRoutes from './routes/stats.js'
import './db/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
const PORT = Number(process.env.PORT || 3000)

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'trade-journal' })
})

app.use('/api/auth', authRoutes)
app.use('/api/accounts', requireAuth, accountRoutes)
app.use('/api/strategies', requireAuth, strategyRoutes)
app.use('/api/exit-reasons', requireAuth, exitReasonRoutes)
app.use('/api/trades', requireAuth, tradeRoutes)
app.use('/api/stats', requireAuth, statsRoutes)

const webDist = path.resolve(__dirname, '../../web/dist')
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next()
      return
    }
    res.sendFile(path.join(webDist, 'index.html'))
  })
}

app.use((error, req, res, next) => {
  console.error('[server]', error)
  res.status(500).json({ message: '服务器内部错误' })
})

app.listen(PORT, () => {
  console.log(`[server] 交易复盘服务已启动: http://localhost:${PORT}`)
})
