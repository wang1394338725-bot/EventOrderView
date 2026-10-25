import axios from "axios";

/**
 * 后端统一返回结构（对应后端 common/Result.java）
 */
export interface Result<T = unknown> {
  code: number;
  message: string;
  data: T;
}

/**
 * 本地存储 key：用户 / 管理员 token
 * request.ts（注入与清除）、stores/user.ts（持久化）、router（路由守卫）共用同一份，
 * 避免 key 不一致导致鉴权失效
 */
export const USER_TOKEN_KEY = "eop_user_token";
export const ADMIN_TOKEN_KEY = "eop_admin_token";

/**
 * axios 实例：baseURL 走 /api（vite proxy 转发到后端 8080，开发期免跨域）
 */
const request = axios.create({
  baseURL: "/api",
  timeout: 15000,
});

// 请求拦截器：按 URL 前缀注入 token——/admin 开头注入管理员 token，其余注入用户 token（都没有则不注入）
request.interceptors.request.use((config) => {
  const isAdmin = (config.url ?? "").startsWith("/admin");
  const token = localStorage.getItem(
    isAdmin ? ADMIN_TOKEN_KEY : USER_TOKEN_KEY,
  );
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：统一拆 Result——code=200 直接放行，否则转 reject（页面 catch 里 ElMessage 弹出 message）
// 返回值标注 any：此处故意"欺骗"类型系统（返回 Result 而非 AxiosResponse），
// 使调用方拿到的是 Result<T>；这是 axios 拦截器拆包的常规写法
request.interceptors.response.use(
  (response): any => {
    const result = response.data as Result;
    if (result.code === 200) {
      return result;
    }
    return Promise.reject(new Error(result.message || "请求失败"));
  },
  (error) => {
    const status = error?.response?.status;
    const isAdmin = (error?.config?.url ?? "").startsWith("/admin");

    // 401：未登录 / token 无效或过期——清对应 token 并跳对应登录页（redirect 带上当前路径回跳）
    if (status === 401) {
      localStorage.removeItem(isAdmin ? ADMIN_TOKEN_KEY : USER_TOKEN_KEY);
      const loginPath = isAdmin ? "/admin/login" : "/login";
      const current = window.location.pathname + window.location.search;
      if (window.location.pathname !== loginPath) {
        // 整页跳转：应用会重新初始化 store，仅清 localStorage 即可保持一致
        window.location.href = `${loginPath}?redirect=${encodeURIComponent(current)}`;
      }
      return Promise.reject(
        new Error(error?.response?.data?.message || "登录已失效，请重新登录"),
      );
    }

    // 403：越权访问
    if (status === 403) {
      return Promise.reject(
        new Error(error?.response?.data?.message || "无权访问"),
      );
    }

    // 其余 HTTP 层错误（400 参数校验、404 路径不存在、500 服务器异常）：后端已由全局异常处理器
    // 统一包装为 Result，故优先取 data.message；若响应不是 Result（如网关错误）再退回 error.message
    const message =
      error?.response?.data?.message ?? error?.message ?? "网络错误";
    return Promise.reject(new Error(message));
  },
);

export default request;
