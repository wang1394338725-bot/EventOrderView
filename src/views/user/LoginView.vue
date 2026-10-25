<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Phone, User } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '../../stores/user'

/**
 * 用户登录页：手机号+密码 / 手机号+短信验证码 双 Tab（Q18/Q25）
 * 密码登录已接业务：调用 store.login()，成功后按 redirect 回跳
 * 短信登录后端暂未提供接口，仅提示
 */
const activeTab = ref<'pwd' | 'sms'>('pwd')
const loading = ref(false)

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
/** 短信 Tab 单独的表单实例：与密码 Tab 共用同一个 ref 会被 Vue 覆盖成最后一个，导致校验永远失败 */
const smsFormRef = ref<FormInstance>()
const form = reactive({ phone: '', password: '', smsCode: '' })

const rules: FormRules = {
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  smsCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
}

async function submit() {
  if (activeTab.value !== 'pwd') {
    const smsValid = await smsFormRef.value?.validate().catch(() => false)
    if (!smsValid) return
    ElMessage.info('短信登录暂未开放，请使用密码登录')
    return
  }
  // validate() 校验失败会 reject，必须 catch，否则异常会冒泡成未处理的 Promise 拒绝并中断后续逻辑
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await userStore.login({ phone: form.phone, password: form.password })
    ElMessage.success('登录成功')
    const redirect = route.query.redirect as string | undefined
    router.replace(redirect || '/')
  } catch (e) {
    ElMessage.error((e as Error).message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-box">
      <h2 class="title">用户登录</h2>
      <el-tabs v-model="activeTab" stretch>
        <el-tab-pane name="pwd" label="密码登录">
          <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" :prefix-icon="Phone" maxlength="11" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password :prefix-icon="User" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane name="sms" label="短信登录">
          <el-form ref="smsFormRef" :model="form" :rules="rules" label-position="top">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" :prefix-icon="Phone" maxlength="11" />
            </el-form-item>
            <el-form-item label="验证码" prop="smsCode">
              <el-input v-model="form.smsCode" placeholder="请输入验证码" :prefix-icon="User">
                <template #append>
                  <el-button>获取验证码</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="submit">
        登录
      </el-button>
      <div class="extra">
        <router-link to="/register" class="link">还没有账号？去注册</router-link>
      </div>
      <!-- 管理员入口：独立的后台登录页，与用户端 token 体系隔离（参考电商"卖家中心"入口的低调位置） -->
      <div class="admin-entry">
        <router-link to="/admin/login" class="admin-link">管理员入口</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef5ff 0%, #f5f7fa 100%);
}

.login-box {
  width: 400px;
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
}

.title {
  text-align: center;
  margin-bottom: 20px;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
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

.admin-entry {
  text-align: center;
  margin-top: 24px;
  padding-top: 12px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.admin-link {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.admin-link:hover {
  color: var(--el-color-primary);
}
</style>
