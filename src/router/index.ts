import { createRouter, createWebHistory } from "vue-router";
import { USER_TOKEN_KEY, ADMIN_TOKEN_KEY } from "../api/request";

/**
 * 路由（vue-router 5）
 * 用户端：公共区页面，走 UserLayout 顶部导航布局
 * 管理端：/admin/** 前缀，走 AdminLayout 侧边栏布局，与后端 /api/admin/** 前缀对应，
 *        将来登录鉴权按前缀拦截时路由守卫也按 /admin/** 一刀切
 * 登录/注册页为独立全屏页，不套布局
 */
const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ---------- 用户端（公共区） ----------
    {
      path: "/",
      component: () => import("../layouts/UserLayout.vue"),
      children: [
        {
          path: "",
          name: "home",
          component: () => import("../views/user/HomeView.vue"),
        },
        {
          path: "products/:id",
          name: "product-detail",
          component: () => import("../views/user/ProductDetailView.vue"),
        },
        {
          path: "orders/confirm",
          name: "order-confirm",
          component: () => import("../views/user/OrderConfirmView.vue"),
        },
        {
          path: "orders",
          name: "order-list",
          component: () => import("../views/user/OrderListView.vue"),
        },
        {
          path: "profile",
          name: "profile",
          component: () => import("../views/user/ProfileView.vue"),
        },
      ],
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/user/LoginView.vue"),
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../views/user/RegisterView.vue"),
    },

    // ---------- 管理端（/admin/** 隔离区） ----------
    {
      path: "/admin/login",
      name: "admin-login",
      component: () => import("../views/admin/AdminLoginView.vue"),
    },
    {
      path: "/admin",
      redirect: "/admin/dashboard",
      component: () => import("../layouts/AdminLayout.vue"),
      children: [
        {
          path: "dashboard",
          name: "admin-dashboard",
          component: () => import("../views/admin/DashboardView.vue"),
        },
        {
          path: "products",
          name: "admin-products",
          component: () => import("../views/admin/ProductAdminView.vue"),
        },
        {
          path: "orders",
          name: "admin-orders",
          component: () => import("../views/admin/OrderAdminView.vue"),
        },
        {
          path: "flows",
          name: "admin-flows",
          component: () => import("../views/admin/FlowRecordView.vue"),
        },
        {
          path: "admins",
          name: "admin-admins",
          component: () => import("../views/admin/AdminManageView.vue"),
        },
      ],
    },
  ],
});

/**
 * 需要用户登录的私密页（下单/我的订单/个人中心），未登录访问时跳 /login
 */
const USER_AUTH_PATHS = ["/orders", "/orders/confirm", "/profile"];

// 全局前置守卫：按 token 存在与否做前端粗粒度拦截（真正的鉴权仍在后端）
router.beforeEach((to) => {
  const userToken = localStorage.getItem(USER_TOKEN_KEY);
  const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);

  // 管理端隔离区：/admin/**（除 /admin/login）需管理员 token
  if (to.path.startsWith("/admin") && to.path !== "/admin/login") {
    if (!adminToken) {
      return { path: "/admin/login", query: { redirect: to.fullPath } };
    }
    return true;
  }

  // 已登录时访问登录页：回跳对应首页
  if (to.path === "/login" && userToken) {
    return { path: "/" };
  }
  if (to.path === "/admin/login" && adminToken) {
    return { path: "/admin/dashboard" };
  }

  // 用户私密页需用户 token
  const needUser = USER_AUTH_PATHS.some(
    (p) => to.path === p || to.path.startsWith(`${p}/`),
  );
  if (needUser && !userToken) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }

  return true;
});

export default router;
