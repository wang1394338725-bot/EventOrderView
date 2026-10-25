import request from "./request";
import type { Result } from "./request";
import type { Order, PageResult } from "./order";

/**
 * 管理员信息（对应后端 admin 实体；role 为数值：1 超管 / 2 普通管理员）
 */
export interface AdminInfo {
  id: number;
  name: string;
  account: string;
  role: number;
}

/** 管理员登录返回：token + 管理员信息 */
export interface AdminLoginResult {
  token: string;
  admin: AdminInfo;
}

/** 管理员详情（列表用，对应后端 AdminDetailResponse，不含 password） */
export interface AdminDetail {
  id: number;
  name: string;
  account: string;
  role: number;
  createdBy: number;
  lastLoginTime: string | null;
  createTime: string;
}

/** 分页对象（对应后端 MyBatis-Plus Page） */
export interface AdminPage {
  records: AdminDetail[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

/** 管理员登录：POST /api/admin/auth/login */
export function adminLogin(data: { account: string; password: string }) {
  return request.post<unknown, Result<AdminLoginResult>>(
    "/admin/auth/login",
    data,
  );
}

/** 管理员分页列表：GET /api/admin/admins（仅超管） */
export function pageAdmins(params: {
  page: number;
  size: number;
  keyword?: string;
}) {
  return request.get<unknown, Result<AdminPage>>("/admin/admins", { params });
}

/** 新增管理员：POST /api/admin/admins（仅超管） */
export function createAdmin(data: {
  name: string;
  account: string;
  password: string;
  role: number;
}) {
  return request.post<unknown, Result<number>>("/admin/admins", data);
}

/** 编辑管理员：PUT /api/admin/admins/{id}（仅超管，只改名称与角色） */
export function updateAdmin(id: number, data: { name: string; role: number }) {
  return request.put<unknown, Result<null>>(`/admin/admins/${id}`, data);
}

/** 删除管理员：DELETE /api/admin/admins/{id}（仅超管） */
export function deleteAdmin(id: number) {
  return request.delete<unknown, Result<null>>(`/admin/admins/${id}`);
}

/** 重置管理员密码：PUT /api/admin/admins/{id}/password（仅超管） */
export function resetAdminPassword(id: number, newPassword: string) {
  return request.put<unknown, Result<null>>(`/admin/admins/${id}/password`, {
    newPassword,
  });
}

/** 管理员登出：POST /api/admin/auth/logout（撤销当前 token） */
export function adminLogoutApi() {
  return request.post<unknown, Result<void>>("/admin/auth/logout");
}

/** 管理端订单分页：GET /api/admin/orders（全量订单，订单号模糊 + 状态/用户精确筛选） */
export function pageAdminOrders(params: {
  page: number;
  size: number;
  orderNo?: string;
  status?: number;
  userId?: number;
}) {
  return request.get<unknown, Result<PageResult<Order>>>("/admin/orders", {
    params,
  });
}
