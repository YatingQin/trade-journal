/**
 * @file init.js
 * @description 初始化 SQLite 数据库表结构与默认数据
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDir = path.resolve(__dirname, '../../data')
const dbPath = path.join(dataDir, 'trade-journal.db')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    market TEXT NOT NULL CHECK(market IN ('CN', 'US')),
    currency TEXT NOT NULL,
    note TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS strategies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS exit_reasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    reason_type TEXT NOT NULL CHECK(reason_type IN ('take_profit', 'stop_loss', 'other')),
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    strategy_id INTEGER,
    exit_reason_id INTEGER,
    symbol TEXT NOT NULL,
    market TEXT NOT NULL CHECK(market IN ('CN', 'US')),
    direction TEXT NOT NULL CHECK(direction IN ('long', 'short')),
    quantity REAL NOT NULL,
    entry_price REAL NOT NULL,
    exit_price REAL,
    fee REAL NOT NULL DEFAULT 0,
    entry_at TEXT NOT NULL,
    exit_at TEXT,
    status TEXT NOT NULL CHECK(status IN ('open', 'closed')) DEFAULT 'open',
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (strategy_id) REFERENCES strategies(id),
    FOREIGN KEY (exit_reason_id) REFERENCES exit_reasons(id)
  );
`)

const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count
if (userCount === 0) {
  const defaultPassword = process.env.APP_PASSWORD || 'trade123'
  const passwordHash = bcrypt.hashSync(defaultPassword, 10)
  db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(
    'admin',
    passwordHash
  )
  console.log(`[init] 已创建默认用户 admin / ${defaultPassword}`)
}

const strategyCount = db.prepare('SELECT COUNT(*) AS count FROM strategies').get().count
if (strategyCount === 0) {
  const insertStrategy = db.prepare(
    'INSERT INTO strategies (name, description) VALUES (?, ?)'
  )
  insertStrategy.run('趋势跟踪', '跟随主趋势进出场')
  insertStrategy.run('突破回踩', '突破后回踩确认入场')
  insertStrategy.run('波段反弹', '超跌反弹短线交易')
}

const reasonCount = db.prepare('SELECT COUNT(*) AS count FROM exit_reasons').get().count
if (reasonCount === 0) {
  const insertReason = db.prepare(
    'INSERT INTO exit_reasons (name, reason_type) VALUES (?, ?)'
  )
  insertReason.run('触及止盈位', 'take_profit')
  insertReason.run('分批止盈', 'take_profit')
  insertReason.run('触及止损位', 'stop_loss')
  insertReason.run('时间止损', 'stop_loss')
  insertReason.run('计划外离场', 'other')
  insertReason.run('基本面变化', 'other')
}

const accountCount = db.prepare('SELECT COUNT(*) AS count FROM accounts').get().count
if (accountCount === 0) {
  const insertAccount = db.prepare(
    'INSERT INTO accounts (name, market, currency, note) VALUES (?, ?, ?, ?)'
  )
  insertAccount.run('A股账户', 'CN', 'CNY', '默认A股账户')
  insertAccount.run('美股账户', 'US', 'USD', '默认美股账户')
}

console.log(`[init] 数据库就绪: ${dbPath}`)
db.close()
