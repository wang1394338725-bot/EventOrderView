<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, User } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '../../stores/user'

/**
 * 管理员登录页：独立于用户登录
 * 已接业务：调用 store.adminLogin()，成功后跳管理端首页（或 redirect 回跳）
 */
const formRef = ref<FormInstance>()
const form = reactive({ account: '', password: '' })
const loading = ref(false)

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const rules: FormRules = {
  account: [{ required: true, message: '请输入管理员账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function submit() {
  // validate() 校验失败会 reject，必须 catch，否则抛未处理拒绝
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await userStore.adminLogin({ account: form.account, password: form.password })
    ElMessage.success('登录成功')
    const redirect = route.query.redirect as string | undefined
    router.replace(redirect || '/admin/dashboard')
  } catch (e) {
    ElMessage.error((e as Error).message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="admin-login-page">
    <div class="login-box">
      <div class="brand">
        <div class="brand-badge">
          <el-icon :size="26"><Lock /></el-icon>
        </div>
        <h2 class="title">管理后台</h2>
        <p class="subtitle">事件驱动订单系统 · 管理端登录</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="管理员账号" prop="account">
          <el-input v-model="form.account" placeholder="请输入管理员账号" :prefix-icon="User" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password
            :prefix-icon="Lock" @keyup.enter="submit" />
        </el-form-item>
      </el-form>
      <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="submit">
        登 录
      </el-button>
      <div class="extra">
        <router-link to="/" class="link">返回用户端首页</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1f2d3d 0%, #2c3e50 100%);
}
.login-box {
  width: 400px;
  background: #fff;
  border-radius: 16px;
  padding: 36px 32px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
}
.brand {
  text-align: center;
  margin-bottom: 24px;
}
.brand-badge {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}
.title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}
.subtitle {
  margin: 0;
  font-size: 13px;
  color: #909399;
}
.submit-btn {
  width: 100%;
  margin-top: 8px;
}
.extra {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
}
.link {
  color: var(--el-color-primary);
}
</style>
