/**
 * @file index.js
 * @description 业务 API 集合
 * @author QYT
 * @date 2026-09-03
 * @version 1.0.0
 */

import http from './http'

export const apiLogin = (payload) => http.post('/auth/login', payload)
export const apiMe = () => http.get('/auth/me')

export const apiGetAccounts = () => http.get('/accounts')
export const apiCreateAccount = (payload) => http.post('/accounts', payload)
export const apiUpdateAccount = (id, payload) => http.put(`/accounts/${id}`, payload)
export const apiDeleteAccount = (id) => http.delete(`/accounts/${id}`)

export const apiGetStrategies = () => http.get('/strategies')
export const apiCreateStrategy = (payload) => http.post('/strategies', payload)
export const apiUpdateStrategy = (id, payload) => http.put(`/strategies/${id}`, payload)
export const apiDeleteStrategy = (id) => http.delete(`/strategies/${id}`)

export const apiGetExitReasons = (params) => http.get('/exit-reasons', { params })
export const apiCreateExitReason = (payload) => http.post('/exit-reasons', payload)
export const apiUpdateExitReason = (id, payload) => http.put(`/exit-reasons/${id}`, payload)
export const apiDeleteExitReason = (id) => http.delete(`/exit-reasons/${id}`)

export const apiGetTrades = (params) => http.get('/trades', { params })
export const apiGetTrade = (id) => http.get(`/trades/${id}`)
export const apiCreateTrade = (payload) => http.post('/trades', payload)
export const apiUpdateTrade = (id, payload) => http.put(`/trades/${id}`, payload)
export const apiDeleteTrade = (id) => http.delete(`/trades/${id}`)

export const apiGetStats = (params) => http.get('/stats', { params })