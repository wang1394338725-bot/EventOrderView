<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import {
  createAdmin,
  deleteAdmin,
  pageAdmins,
  resetAdminPassword,
  updateAdmin,
} from '../../api/admin'
import type { AdminDetail } from '../../api/admin'

// ---------- 列表状态 ----------
const list = ref<AdminDetail[]>([])
const total = ref(0)
const loading = ref(false)
const query = reactive({ page: 1, size: 10, keyword: '' })

async function loadList() {
  loading.value = true
  try {
    const res = await pageAdmins({
      page: query.page,
      size: query.size,
      keyword: query.keyword || undefined,
    })
    list.value = res.data.records
    total.value = res.data.total
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

function search() {
  query.page = 1
  loadList()
}

// ---------- 新增/编辑弹窗 ----------
const dialogVisible = ref(false)
const editingId = ref<number | null>(null) // null=新增模式
const formRef = ref<FormInstance>()
const form = reactive({ name: '', account: '', password: '', role: 2 })

const rules: FormRules = {
  name: [{ required: true, message: '管理员名称不能为空', trigger: 'blur' }],
  account: [
    { required: true, message: '账号不能为空', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9_]{4,20}$/, message: '账号需为 4-20 位字母、数字或下划线', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '密码不能为空', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度需为 6-32 位', trigger: 'blur' },
  ],
}

function openCreate() {
  editingId.value = null
  Object.assign(form, { name: '', account: '', password: '', role: 2 })
  dialogVisible.value = true
}

function openEdit(row: AdminDetail) {
  editingId.value = row.id
  Object.assign(form, { name: row.name, role: row.role })
  dialogVisible.value = true
}

async function submitForm() {
  // validate() 校验失败会 reject，必须 catch，否则抛未处理拒绝
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  try {
    if (editingId.value === null) {
      await createAdmin({ ...form })
      ElMessage.success('新增成功')
    } else {
      // 编辑只提交名称与角色：账号是登录凭证、密码走独立重置接口
      await updateAdmin(editingId.value, { name: form.name, role: form.role })
      ElMessage.success('编辑成功')
    }
    dialogVisible.value = false
    loadList()
  } catch (e) {
    ElMessage.error((e as Error).message)
  }
}

// ---------- 重置密码弹窗 ----------
const pwdVisible = ref(false)
const pwdTarget = ref<AdminDetail | null>(null)
const pwdFormRef = ref<FormInstance>()
const pwdForm = reactive({ newPassword: '' })
const pwdRules: FormRules = {
  newPassword: [
    { required: true, message: '新密码不能为空', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度需为 6-32 位', trigger: 'blur' },
  ],
}

function openResetPassword(row: AdminDetail) {
  pwdTarget.value = row
  pwdForm.newPassword = ''
  pwdVisible.value = true
}

async function submitResetPassword() {
  if (!pwdTarget.value) return
  const valid = await pwdFormRef.value?.validate().catch(() => false)
  if (!valid) return
  try {
    await resetAdminPassword(pwdTarget.value.id, pwdForm.newPassword)
    ElMessage.success('密码已重置')
    pwdVisible.value = false
  } catch (e) {
    ElMessage.error((e as Error).message)
  }
}

// ---------- 删除 ----------
async function remove(row: AdminDetail) {
  try {
    await ElMessageBox.confirm(`确认删除管理员「${row.name}」？`, '提示', { type: 'warning' })
  } catch {
    return // 用户取消
  }
  try {
    await deleteAdmin(row.id)
    ElMessage.success('删除成功')
    loadList()
  } catch (e) {
    ElMessage.error((e as Error).message)
  }
}

onMounted(loadList)
</script>

<template>
  <div class="page">
    <el-card shadow="never">
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="按名称或账号搜索" clearable class="w200"
          @keyup.enter="search" />
        <el-button type="primary" @click="search">查询</el-button>
        <el-button type="success" :icon="Plus" @click="openCreate">新增管理员</el-button>
        <span class="tip">仅超级管理员可管理管理员账号</span>
      </div>

      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column prop="id" label="ID" width="64" />
        <el-table-column prop="name" label="名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="account" label="账号" min-width="140" show-overflow-tooltip />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 1 ? 'danger' : 'info'">
              {{ row.role === 1 ? '超级管理员' : '普通管理员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建人" width="100">
          <template #default="{ row }">
            {{ row.createdBy === 0 ? 'system' : row.createdBy }}
          </template>
        </el-table-column>
        <el-table-column label="最近登录" width="170">
          <template #default="{ row }">{{ row.lastLoginTime || '-' }}</template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="warning" @click="openResetPassword(row)">重置密码</el-button>
            <el-button link type="danger" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination v-model:current-page="query.page" v-model:page-size="query.size" :total="total"
        :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" class="pager"
        @current-change="loadList" @size-change="search" />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingId === null ? '新增管理员' : '编辑管理员'"
      width="460px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" maxlength="32" />
        </el-form-item>
        <el-form-item v-if="editingId === null" label="账号" prop="account">
          <el-input v-model="form.account" maxlength="20" placeholder="4-20 位字母、数字或下划线" />
        </el-form-item>
        <el-form-item v-if="editingId === null" label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="角色">
          <el-radio-group v-model="form.role">
            <el-radio :value="2">普通管理员</el-radio>
            <el-radio :value="1">超级管理员</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog v-model="pwdVisible" title="重置密码" width="420px">
      <p v-if="pwdTarget" class="stock-tip">目标管理员：{{ pwdTarget.name }}（{{ pwdTarget.account }}）</p>
      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="80px">
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="pwdForm.newPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdVisible = false">取消</el-button>
        <el-button type="primary" @click="submitResetPassword">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page {
  padding: 0;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.w200 {
  width: 220px;
}
.tip {
  margin-left: auto;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.pager {
  margin-top: 12px;
  justify-content: flex-end;
}
.stock-tip {
  margin: 0 0 12px;
  color: var(--el-text-color-secondary);
}
</style>
