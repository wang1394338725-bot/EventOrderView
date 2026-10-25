<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules, UploadRequestOptions } from 'element-plus'
import {
  createProduct,
  pageProducts,
  stockIn,
  updateProduct,
  updateProductStatus,
  uploadImage,
} from '../../api/product'
import type { Product } from '../../api/product'

// ---------- 列表状态 ----------
const list = ref<Product[]>([])
const total = ref(0)
const loading = ref(false)
const query = reactive({ page: 1, size: 10, keyword: '', status: undefined as number | undefined })

async function loadList() {
  loading.value = true
  try {
    const res = await pageProducts({
      page: query.page,
      size: query.size,
      keyword: query.keyword || undefined,
      status: query.status,
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
const form = reactive({ name: '', price: 0.01, merchantName: '', description: '', imageUrl: '' })

const rules: FormRules = {
  name: [{ required: true, message: '商品名称不能为空', trigger: 'blur' }],
  price: [{ required: true, message: '价格不能为空', trigger: 'blur' }],
}

function openCreate() {
  editingId.value = null
  Object.assign(form, { name: '', price: 0.01, merchantName: '', description: '', imageUrl: '' })
  dialogVisible.value = true
}

function openEdit(row: Product) {
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    price: row.price,
    merchantName: row.merchantName,
    description: row.description ?? '',
    imageUrl: row.imageUrl ?? '',
  })
  dialogVisible.value = true
}

async function submitForm() {
  // validate() 校验失败会 reject，必须 catch，否则抛未处理拒绝
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  try {
    if (editingId.value === null) {
      await createProduct({ ...form })
      ElMessage.success('录入成功，初始库存为 0，请通过「入库」补充库存')
    } else {
      await updateProduct(editingId.value, { ...form })
      ElMessage.success('编辑成功')
    }
    dialogVisible.value = false
    loadList()
  } catch (e) {
    ElMessage.error((e as Error).message)
  }
}

// ---------- 图片上传（el-upload 自定义上传：不走默认 XHR，改调我们的 api） ----------
const uploading = ref(false)
async function doUpload(options: UploadRequestOptions) {
  uploading.value = true
  try {
    const res = await uploadImage(options.file as File)
    form.imageUrl = res.data
    ElMessage.success('上传成功')
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    uploading.value = false
  }
}

// ---------- 入库弹窗 ----------
const stockDialogVisible = ref(false)
const stockTarget = ref<Product | null>(null)
const stockQuantity = ref(1)

function openStockIn(row: Product) {
  stockTarget.value = row
  stockQuantity.value = 1
  stockDialogVisible.value = true
}

async function submitStockIn() {
  if (!stockTarget.value) return
  try {
    await stockIn(stockTarget.value.id, stockQuantity.value)
    ElMessage.success('入库成功')
    stockDialogVisible.value = false
    loadList()
  } catch (e) {
    ElMessage.error((e as Error).message)
  }
}

// ---------- 上下架 ----------
async function toggleStatus(row: Product) {
  try {
    await updateProductStatus(row.id, row.status)
    ElMessage.success(row.status === 1 ? '已上架' : '已下架')
  } catch (e) {
    ElMessage.error((e as Error).message)
    loadList() // 失败回滚开关显示
  }
}

onMounted(loadList)
</script>

<template>
  <div class="page">
    <el-card shadow="never">
      <!-- 搜索栏 -->
      <div class="toolbar">
        <el-input
          v-model="query.keyword"
          placeholder="按商品名称搜索"
          clearable
          class="w200"
          @keyup.enter="search"
        />
        <el-select v-model="query.status" placeholder="状态" clearable class="w120">
          <el-option label="上架" :value="1" />
          <el-option label="下架" :value="0" />
        </el-select>
        <el-button type="primary" @click="search">查询</el-button>
        <el-button type="success" @click="openCreate">新增商品</el-button>
      </div>

      <!-- 列表 -->
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column prop="id" label="ID" width="64" />
        <el-table-column label="图片" width="80">
          <template #default="{ row }">
            <el-image
              v-if="row.imageUrl"
              :src="row.imageUrl"
              :preview-src-list="[row.imageUrl]"
              preview-teleported
              fit="cover"
              class="img"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
        <el-table-column label="价格" width="100">
          <template #default="{ row }">￥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column prop="merchantName" label="商家" width="120" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="toggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="warning" @click="openStockIn(row)">入库</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.size"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        class="pager"
        @current-change="loadList"
        @size-change="search"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId === null ? '新增商品' : '编辑商品'"
      width="520px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" maxlength="128" />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="form.price" :min="0.01" :precision="2" :step="1" />
        </el-form-item>
        <el-form-item label="商家">
          <el-input v-model="form.merchantName" maxlength="64" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" maxlength="512" />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload :show-file-list="false" accept=".jpg,.jpeg,.png,.webp" :http-request="doUpload">
            <el-button :loading="uploading">上传图片</el-button>
          </el-upload>
          <el-image v-if="form.imageUrl" :src="form.imageUrl" fit="cover" class="preview" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>

    <!-- 入库弹窗 -->
    <el-dialog v-model="stockDialogVisible" title="商品入库" width="360px">
      <p v-if="stockTarget" class="stock-tip">
        {{ stockTarget.name }} 当前库存：{{ stockTarget.stock }}
      </p>
      <el-input-number v-model="stockQuantity" :min="1" :step="1" class="w200" />
      <template #footer>
        <el-button @click="stockDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStockIn">确认入库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page {
  padding: 16px;
}
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.w200 {
  width: 200px;
}
.w120 {
  width: 120px;
}
.img {
  width: 48px;
  height: 48px;
  display: block;
}
.pager {
  margin-top: 12px;
  justify-content: flex-end;
}
.preview {
  width: 96px;
  height: 96px;
  margin-top: 8px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color);
}
.stock-tip {
  margin: 0 0 12px;
  color: var(--el-text-color-secondary);
}
</style>
