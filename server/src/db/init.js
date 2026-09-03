/**
 * @file init.js
 * @description 使用 DATABASE_URL 初始化 PostgreSQL 表结构与默认数据
 * @author QYT
 * @date 2026-09-03
 * @version 2.0.0
 */

import { initSchema } from './database.js'

/**
 * @description 独立运行时初始化 schema 后退出
 * @returns {Promise<void>}
 */
async function main() {
  try {
    await initSchema()
    process.exit(0)
  } catch (error) {
    console.error('[init] 初始化失败:', error.message)
    process.exit(1)
  }
}

main()