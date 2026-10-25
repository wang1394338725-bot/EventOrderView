import request from './request'
import type { Result } from './request'

/**
 * 用户信息（对应后端 user 实体，字段驼峰）
 */
export interface UserInfo {
  id: number
  username: string
  phone: string
  email: string | null
  balance: number
}

/** 登录返回：token + 用户信息 */
export interface LoginResult {
  token: string
  user: UserInfo
}

/** 注册表单 */
export interface RegisterForm {
  username: string
  phone: string
  email?: string
  password: string
}

/** 注册：POST /api/auth/register，返回新用户 id */
export function register(data: RegisterForm) {
  return request.post<unknown, Result<number>>('/auth/register', data)
}

/** 登录：POST /api/auth/login */
export function login(data: { phone: string; password: string }) {
  return request.post<unknown, Result<LoginResult>>('/auth/login', data)
}

/** 登出：POST /api/auth/logout（需 Bearer） */
export function logout() {
  return request.post<unknown, Result<void>>('/auth/logout')
}

/** 当前用户信息：GET /api/auth/me（需 Bearer） */
export function me() {
  return request.get<unknown, Result<UserInfo>>('/auth/me')
}

/** 充值：POST /api/users/recharge（需 Bearer），body {amount} */
export function recharge(amount: number) {
  return request.post<unknown, Result<void>>('/users/recharge', { amount })
}
