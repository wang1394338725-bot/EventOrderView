<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Phone, User, Message } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { register } from '../../api/user'

/**
 * 用户注册页：用户名（昵称）+手机号+密码+邮箱可选（Q27）
 * 已接业务：调 register 接口，成功后跳登录页
 */
const router = useRouter()
const formRef = ref<FormInstance>()
const form = reactive({ username: '', phone: '', password: '', email: '' })
const loading = ref(false)

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
}

async function submit() {
  // validate() 校验失败会 reject，必须 catch，否则抛未处理拒绝
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await register({
      username: form.username,
      phone: form.phone,
      password: form.password,
      email: form.email || undefined,
    })
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (e) {
    ElMessage.error((e as Error).message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-page">
    <div class="register-box">
      <h2 class="title">用户注册</h2>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="用户名（昵称）" prop="username">
          <el-input v-model="form.username" placeholder="给自己起个名字" :prefix-icon="User" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" :prefix-icon="Phone" maxlength="11" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="设置登录密码" show-password
            :prefix-icon="User" />
        </el-form-item>
        <el-form-item label="邮箱（可选）" prop="email">
          <el-input v-model="form.email" placeholder="用于找回密码提示" :prefix-icon="Message" />
        </el-form-item>
      </el-form>

      <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="submit">
        注册
      </el-button>
      <div class="extra">
        <router-link to="/login" class="link">已有账号？去登录</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef5ff 0%, #f5f7fa 100%);
}
.register-box {
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
</style>
