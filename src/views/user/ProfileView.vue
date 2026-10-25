<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit, Key, Money, User } from '@element-plus/icons-vue'
import { useUserStore } from '../../stores/user'
import { recharge } from '../../api/user'

/**
 * 个人中心：余额展示、充值入口、账号信息
 * 数据来源 GET /api/auth/me（进页面刷新一次，保证充值/支付后余额最新）
 */
const userStore = useUserStore()

const loading = ref(false)
const dialogVisible = ref(false)
const amount = ref(100)
const submitting = ref(false)

async function loadUser() {
  loading.value = true
  try {
    await userStore.refreshUser()
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

function openRecharge() {
  amount.value = 100
  dialogVisible.value = true
}

async function submitRecharge() {
  if (submitting.value) return
  submitting.value = true
  try {
    await recharge(amount.value)
    // 充值成功后重新拉取，余额与本地 store 保持一致
    await userStore.refreshUser()
    ElMessage.success(`充值成功，当前余额 ￥${(userStore.userInfo?.balance ?? 0).toFixed(2)}`)
    dialogVisible.value = false
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    submitting.value = false
  }
}

onMounted(loadUser)
</script>

<template>
  <div class="profile">
    <el-row :gutter="20">
      <!-- 左侧基本信息 -->
      <el-col :span="8">
        <el-card v-loading="loading" shadow="never" class="card">
          <div class="avatar-area">
            <el-avatar :size="72" class="avatar">
              <el-icon :size="32"><User /></el-icon>
            </el-avatar>
            <div class="nickname">{{ userStore.userInfo?.username || '用户' }}</div>
            <div class="phone">{{ userStore.userInfo?.phone || '-' }}</div>
          </div>
          <el-divider />
          <div class="info-rows">
            <div class="info-row">
              <span class="label">手机</span>
              <span>{{ userStore.userInfo?.phone || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">邮箱</span>
              <span :class="{ muted: !userStore.userInfo?.email }">
                {{ userStore.userInfo?.email || '未绑定' }}
              </span>
            </div>
          </div>
          <el-button type="primary" class="edit-btn" :icon="Edit">编辑资料</el-button>
        </el-card>
      </el-col>

      <!-- 右侧余额与操作 -->
      <el-col :span="16">
        <el-card shadow="never" class="card">
          <template #header>
            <div class="card-header">
              <span><el-icon><Money /></el-icon> 我的余额</span>
              <el-button type="primary" size="small" :icon="Key" @click="openRecharge">充值</el-button>
            </div>
          </template>
          <div class="balance">
            <span class="balance-label">当前余额</span>
            <span class="balance-amount">￥{{ (userStore.userInfo?.balance ?? 0).toFixed(2) }}</span>
          </div>
        </el-card>

        <el-card shadow="never" class="card" style="margin-top: 16px;">
          <template #header>
            <span class="card-header">安全设置</span>
          </template>
          <div class="safe-row">
            <span>登录密码</span>
            <el-button link type="primary">修改</el-button>
          </div>
          <div class="safe-row">
            <span>绑定邮箱</span>
            <el-button link type="primary">去绑定</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 充值弹窗 -->
    <el-dialog v-model="dialogVisible" title="账户充值" width="380px">
      <el-form label-width="72px">
        <el-form-item label="充值金额">
          <el-input-number v-model="amount" :min="0.01" :max="1000000" :precision="2"
            :step="100" :controls="false" class="amount-input" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRecharge">确认充值</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.profile {
  max-width: 1100px;
  margin: 0 auto;
}
.card {
  border-radius: 12px;
}
.avatar-area {
  text-align: center;
}
.avatar {
  background-color: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
  margin-bottom: 12px;
}
.nickname {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
.phone {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}
.info-rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}
.label {
  color: #909399;
}
.muted {
  color: #c0c4cc;
}
.edit-btn {
  margin-top: 16px;
  width: 100%;
}
.card-header {
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.balance {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
}
.balance-label {
  font-size: 14px;
  color: #909399;
}
.balance-amount {
  font-size: 32px;
  font-weight: 700;
  color: #f56c6c;
}
.safe-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  font-size: 14px;
  color: #303133;
}
.safe-row + .safe-row {
  border-top: 1px solid var(--el-border-color-light);
}
.amount-input {
  width: 100%;
}
</style>
