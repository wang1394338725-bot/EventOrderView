<script setup lang="ts">
import { ShoppingCart } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

/**
 * 用户端布局：顶部导航（logo + 菜单 + 登录/注册入口）+ 内容区
 * 右上角按登录态显示：未登录→登录/注册；已登录→昵称/退出
 */
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

async function handleLogout() {
  await userStore.logout()
  router.replace('/login')
}
</script>

<template>
  <div class="layout">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="header-inner">
        <router-link to="/" class="brand">
          <el-icon :size="22" color="#409eff"><ShoppingCart /></el-icon>
          <span class="brand-name">EventOrder 商城</span>
        </router-link>

        <el-menu :default-active="route.path" mode="horizontal" router class="nav-menu">
          <el-menu-item index="/">首页</el-menu-item>
          <el-menu-item index="/orders">我的订单</el-menu-item>
          <el-menu-item index="/profile">个人中心</el-menu-item>
        </el-menu>

        <div class="actions">
          <template v-if="userStore.token">
            <span class="nickname">{{ userStore.userInfo?.username || '用户' }}</span>
            <el-button type="primary" plain @click="handleLogout">退出</el-button>
          </template>
          <template v-else>
            <el-button type="primary" plain @click="$router.push('/login')">登录</el-button>
            <el-button type="primary" @click="$router.push('/register')">注册</el-button>
          </template>
        </div>
      </div>
    </header>

    <!-- 内容区 -->
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}
.header {
  background: #fff;
  border-bottom: 1px solid var(--el-border-color-light);
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 0 16px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.brand-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
.nav-menu {
  flex: 1;
  border-bottom: none;
}
.actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  align-items: center;
}
.nickname {
  font-size: 14px;
  color: #303133;
}
.main {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 16px 40px;
}
</style>
