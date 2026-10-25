import { ref } from "vue";
import { defineStore } from "pinia";
import {
  login as loginApi,
  logout as logoutApi,
  me as meApi,
} from "../api/user";
import { adminLogin as adminLoginApi, adminLogoutApi } from "../api/admin";
import { USER_TOKEN_KEY, ADMIN_TOKEN_KEY } from "../api/request";
import type { UserInfo } from "../api/user";
import type { AdminInfo } from "../api/admin";

/** 用户信息 / 管理员信息的持久化 key（与 token key 命名风格一致） */
const USER_INFO_KEY = "eop_user_info";
const ADMIN_INFO_KEY = "eop_admin_info";

/** 读取并解析 localStorage 里的 JSON，异常时返回 null */
function readJson<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * 登录态 store：用户 / 管理员两套身份各自独立持久化
 * token key 与 request.ts 读取的一致（USER_TOKEN_KEY / ADMIN_TOKEN_KEY），保证鉴权不失效
 */
export const useUserStore = defineStore("user", () => {
  const token = ref(localStorage.getItem(USER_TOKEN_KEY) ?? "");
  const userInfo = ref<UserInfo | null>(readJson<UserInfo>(USER_INFO_KEY));
  const adminToken = ref(localStorage.getItem(ADMIN_TOKEN_KEY) ?? "");
  const adminInfo = ref<AdminInfo | null>(readJson<AdminInfo>(ADMIN_INFO_KEY));

  function setUserAuth(t: string, info: UserInfo) {
    token.value = t;
    userInfo.value = info;
    localStorage.setItem(USER_TOKEN_KEY, t);
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(info));
  }

  function clearUser() {
    token.value = "";
    userInfo.value = null;
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
  }

  function setAdminAuth(t: string, info: AdminInfo) {
    adminToken.value = t;
    adminInfo.value = info;
    localStorage.setItem(ADMIN_TOKEN_KEY, t);
    localStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(info));
  }

  function clearAdmin() {
    adminToken.value = "";
    adminInfo.value = null;
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_INFO_KEY);
  }

  /** 用户登录：调接口、落盘 token + userInfo */
  async function login(payload: { phone: string; password: string }) {
    const res = await loginApi(payload);
    setUserAuth(res.data.token, res.data.user);
    return res.data;
  }

  /** 用户登出：先尽力调后端，随后清空本地 */
  async function logout() {
    try {
      await logoutApi();
    } catch {
      // 后端登出失败不阻断本地清理
    }
    clearUser();
  }

  /** 管理员登录：调接口、落盘 token + adminInfo */
  async function adminLogin(payload: { account: string; password: string }) {
    const res = await adminLoginApi(payload);
    setAdminAuth(res.data.token, res.data.admin);
    return res.data;
  }

  /** 管理员登出：先尽力调后端撤销 token，随后清空本地 */
  async function adminLogout() {
    try {
      await adminLogoutApi();
    } catch {
      // 后端登出失败不阻断本地清理
    }
    clearAdmin();
  }

  /** 刷新用户信息：GET /auth/me，回写 store 与 localStorage */
  async function refreshUser() {
    const res = await meApi();
    userInfo.value = res.data;
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(res.data));
    return res.data;
  }

  return {
    token,
    userInfo,
    adminToken,
    adminInfo,
    login,
    logout,
    adminLogin,
    adminLogout,
    refreshUser,
  };
});
