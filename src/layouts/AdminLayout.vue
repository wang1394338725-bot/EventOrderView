<script setup lang="ts">
import {
  DataAnalysis,
  Files,
  Goods,
  Notebook,
  Setting,
  SwitchButton,
  UserFilled,
} from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

/**
 * 管理端布局：左侧菜单（看板/商品/订单/流水/管理员）+ 顶栏 + 内容区
 * 顶栏显示当前管理员名称，退出按钮清本地登录态并跳 /admin/login
 */
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

async function handleLogout() {
  // 必须等本地 token 清完再跳转：否则路由守卫看到 token 还在，会把 /admin/login 回弹到 dashboard
  await userStore.adminLogout()
  router.replace('/admin/login')
}
</script>

<template>
  <el-container class="layout">
    <!-- 侧边栏 -->
    <el-aside width="200px" class="aside">
      <div class="brand">
        <el-icon :size="20" color="#fff"><Setting /></el-icon>
        <span>管理后台</span>
      </div>
      <el-menu :default-active="route.path" router class="side-menu" background-color="#001529"
        text-color="#a6adb4" active-text-color="#fff">
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据看板</span>
        </el-menu-item>
        <el-menu-item index="/admin/products">
          <el-icon><Goods /></el-icon>
          <span>商品管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/orders">
          <el-icon><Files /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/flows">
          <el-icon><Notebook /></el-icon>
          <span>流水记录</span>
        </el-menu-item>
        <el-menu-item index="/admin/admins">
          <el-icon><UserFilled /></el-icon>
          <span>管理员管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右侧 -->
    <el-container>
      <el-header class="header" height="60px">
        <span class="page-title">事件驱动订单系统 · 管理端</span>
        <el-dropdown>
          <span class="admin-info">
            <el-avatar :size="28" class="avatar">
              <el-icon><UserFilled /></el-icon>
            </el-avatar>
            <span class="admin-name">{{ userStore.adminInfo?.name || '管理员' }}</span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleLogout">
                <el-icon><SwitchButton /></el-icon>退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout {
  height: 100%;
}
.aside {
  background-color: #001529;
  display: flex;
  flex-direction: column;
}
.brand {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.side-menu {
  border-right: none;
  flex: 1;
}
.header {
  background: #fff;
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.page-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
.admin-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  outline: none;
}
.avatar {
  background-color: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
}
.admin-name {
  font-size: 14px;
  color: #303133;
}
.main {
  background-color: #f5f7fa;
  padding: 16px;
}
</style>
