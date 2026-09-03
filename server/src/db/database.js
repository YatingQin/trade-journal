/**
 * @file database.js
 * @description SQLite 数据库连接单例
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.resolve(__dirname, '../../data')
const dbPath = path.join(dataDir, 'trade-journal.db')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

if (!fs.existsSync(dbPath)) {
  spawnSync(process.execPath, [path.join(__dirname, 'init.js')], {
    stdio: 'inherit'
  })
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export default db
