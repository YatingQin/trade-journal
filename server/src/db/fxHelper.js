/**
 * @file fxHelper.js
 * @description 汇率换算（美股盈亏折合人民币）
 * @author QYT
 * @date 2026-09-04
 * @version 1.0.0
 */

/** 默认美元兑人民币汇率（可用环境变量 USD_CNY_RATE 覆盖） */
const DEFAULT_USD_CNY_RATE = 7.25

/**
 * @description 读取当前使用的 USD/CNY 汇率
 * @returns {number}
 */
export function getUsdCnyRate() {
  const fromEnv = Number(process.env.USD_CNY_RATE)
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return fromEnv
  }
  return DEFAULT_USD_CNY_RATE
}

/**
 * @description 将金额折合为人民币
 * @param {number} amount 原始金额
 * @param {string} currency 货币代码 CNY / USD
 * @param {number=} usdCnyRate 汇率
 * @returns {number}
 */
export function toCny(amount, currency, usdCnyRate = getUsdCnyRate()) {
  const value = Number(amount) || 0
  if (currency === 'USD') {
    return value * usdCnyRate
  }
  return value
}
