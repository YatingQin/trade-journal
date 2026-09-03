/**
 * @file format.js
 * @description 展示格式化工具
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

const MARKET_LABEL = {
  CN: 'A股',
  US: '美股'
}

const DIRECTION_LABEL = {
  long: '做多',
  short: '做空'
}

const REASON_TYPE_LABEL = {
  take_profit: '止盈',
  stop_loss: '止损',
  other: '其他'
}

/**
 * @description 市场文案
 * @param {string} market
 * @returns {string}
 */
export function formatMarket(market) {
  return MARKET_LABEL[market] || market || '-'
}

/**
 * @description 方向文案
 * @param {string} direction
 * @returns {string}
 */
export function formatDirection(direction) {
  return DIRECTION_LABEL[direction] || direction || '-'
}

/**
 * @description 原因类型文案
 * @param {string} reasonType
 * @returns {string}
 */
export function formatReasonType(reasonType) {
  return REASON_TYPE_LABEL[reasonType] || reasonType || '-'
}

/**
 * @description 金额展示
 * @param {number|null|undefined} value
 * @param {string} [currency]
 * @returns {string}
 */
export function formatMoney(value, currency = '') {
  if (value == null || Number.isNaN(Number(value))) {
    return '-'
  }
  const num = Number(value)
  const text = num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  })
  return currency ? `${text} ${currency}` : text
}

/**
 * @description 百分比展示
 * @param {number|null|undefined} value
 * @returns {string}
 */
export function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '-'
  }
  return `${Number(value).toFixed(2)}%`
}

/**
 * @description datetime-local 输入值
 * @param {string|null|undefined} value
 * @returns {string}
 */
export function toDateTimeLocal(value) {
  if (!value) {
    return ''
  }
  const date = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 16)
  }
  const pad = (num) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * @description 提交前把 datetime-local 转成后端字符串
 * @param {string} value
 * @returns {string}
 */
export function fromDateTimeLocal(value) {
  if (!value) {
    return ''
  }
  return value.replace('T', ' ') + ':00'
}
