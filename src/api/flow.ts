import request from './request'
import type { Result } from './request'
import type { PageResult } from './order'

/**
 * 余额流水（对应后端 entity/BalanceFlow）
 * changeType：1充值 2扣款 3退款 4回滚
 */
export interface BalanceFlow {
  id: number
  userId: number
  changeType: number
  amount: number
  beforeBalance: number
  afterBalance: number
  orderNo: string | null
  createTime: string
}

/**
 * 库存流水（对应后端 entity/StockFlow）
 * changeType：1下单扣减 2取消回补 3超时或失败回补 4入库
 */
export interface StockFlow {
  id: number
  productId: number
  changeType: number
  quantity: number
  beforeStock: number
  afterStock: number
  orderNo: string | null
  createTime: string
}

/** 操作日志（对应后端 entity/OperationLog） */
export interface OperationLog {
  id: number
  adminId: number
  opType: string
  opContent: string
  createTime: string
}

/** 余额流水分页：GET /api/admin/flows/balance */
export function pageBalanceFlows(params: {
  page: number
  size: number
  userId?: number
  orderNo?: string
  changeType?: number
}) {
  return request.get<unknown, Result<PageResult<BalanceFlow>>>('/admin/flows/balance', { params })
}

/** 库存流水分页：GET /api/admin/flows/stock */
export function pageStockFlows(params: {
  page: number
  size: number
  productId?: number
  orderNo?: string
  changeType?: number
}) {
  return request.get<unknown, Result<PageResult<StockFlow>>>('/admin/flows/stock', { params })
}

/** 操作日志分页：GET /api/admin/flows/operation */
export function pageOperationLogs(params: {
  page: number
  size: number
  adminId?: number
  opType?: string
}) {
  return request.get<unknown, Result<PageResult<OperationLog>>>('/admin/flows/operation', {
    params,
  })
}
