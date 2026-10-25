import request from "./request";
import type { Result } from "./request";

/**
 * 订单实体（对应后端 entity/Orders，字段驼峰对应数据库下划线）
 * 状态机：0待支付 1处理中 2成功 3失败 4支付超时 5待交付 6已取消
 */
export interface Order {
  id: number;
  orderNo: string;
  userId: number;
  productId: number;
  productName: string;
  quantity: number;
  prepaidAmount: number;
  actualAmount: number | null;
  status: number;
  payTime: string | null;
  createTime: string;
  updateTime: string | null;
}

/** MP Page 序列化后本页用到的两个字段 */
export interface PageResult<T> {
  records: T[];
  total: number;
}

/** 支付接口返回：status 恒为 1 处理中，最终结果以 SSE 推送为准 */
export interface OrderPayResult {
  orderNo: string;
  status: number;
  tip: string;
}

/**
 * 下单：POST /api/orders {requestId, productId, quantity}，返回业务订单号
 * requestId 为幂等键：进入确认页时生成一次，重复提交/并发重复请求都只落一笔订单并返回同一订单号
 */
export function createOrder(data: {
  requestId: string;
  productId: number;
  quantity: number;
}) {
  return request.post<unknown, Result<string>>("/orders", data);
}

/** 支付（模拟）：POST /api/orders/{orderNo}/pay，返回"处理中"提示 */
export function payOrder(orderNo: string) {
  return request.post<unknown, Result<OrderPayResult>>(
    `/orders/${orderNo}/pay`,
  );
}

/** 取消：POST /api/orders/{orderNo}/cancel（仅待交付可取消） */
export function cancelOrder(orderNo: string) {
  return request.post<unknown, Result<void>>(`/orders/${orderNo}/cancel`);
}

/** 我的订单分页：GET /api/orders（status 为空则不过滤） */
export function pageOrders(params: {
  page: number;
  size: number;
  status?: number;
}) {
  return request.get<unknown, Result<PageResult<Order>>>("/orders", { params });
}

/** 订单详情：GET /api/orders/{orderNo}（仅本人可见） */
export function getOrder(orderNo: string) {
  return request.get<unknown, Result<Order>>(`/orders/${orderNo}`);
}
