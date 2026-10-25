<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { pageAdminOrders } from '../../api/admin'
import type { Order } from '../../api/order'

/**
 * 订单管理页（管理端）：只读查询，全量订单
 * 状态机：0待支付 1处理中 2成功 3失败 4支付超时 5待交付 6已取消
 */
const query = reactive({
  orderNo: '',
  status: undefined as number | undefined,
  userId: undefined as number | undefined,
  page: 1,
  size: 10,
})

type StatusTagType = 'info' | 'warning' | 'success' | 'danger' | 'primary'

const statusOptions: { label: string; value: number; type: StatusTagType }[] = [
  { label: '待支付', value: 0, type: 'info' },
  { label: '处理中', value: 1, type: 'warning' },
  { label: '成功', value: 2, type: 'success' },
  { label: '失败', value: 3, type: 'danger' },
  { label: '支付超时', value: 4, type: 'info' },
  { label: '待交付', value: 5, type: 'primary' },
  { label: '已取消', value: 6, type: 'info' },
]

/** status → {label,type}；未知状态原样展示，避免脏数据导致空白 */
function statusOf(status: number) {
  return statusOptions.find((s) => s.value === status) ?? { label: `未知(${status})`, type: 'info' as const }
}

const list = ref<Order[]>([])
const total = ref(0)
const loading = ref(false)

async function loadList() {
  loading.value = true
  try {
    const res = await pageAdminOrders({
      page: query.page,
      size: query.size,
      orderNo: query.orderNo || undefined,
      status: query.status,
      userId: query.userId,
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

function reset() {
  query.orderNo = ''
  query.status = undefined
  query.userId = undefined
  search()
}

// 订单详情抽屉：直接用行数据渲染（列表接口已返回完整实体，无需二次请求）
const detailVisible = ref(false)
const current = ref<Order | null>(null)

function openDetail(row: Order) {
  current.value = row
  detailVisible.value = true
}

onMounted(loadList)
</script>

<template>
  <div class="page">
    <el-card shadow="never">
      <!-- 筛选栏 -->
      <div class="toolbar">
        <el-input v-model="query.orderNo" placeholder="按订单号搜索" clearable class="w200"
          @keyup.enter="search" />
        <el-select v-model="query.status" placeholder="订单状态" clearable class="w140">
          <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
        <el-input-number v-model="query.userId" :min="1" :controls="false" placeholder="用户 ID"
          class="w140" />
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </div>

      <!-- 订单列表 -->
      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column prop="orderNo" label="订单号" min-width="190" show-overflow-tooltip />
        <el-table-column prop="productName" label="商品" min-width="140" show-overflow-tooltip />
        <el-table-column prop="userId" label="用户 ID" width="90" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column label="预付金额" width="110">
          <template #default="{ row }">￥{{ row.prepaidAmount }}</template>
        </el-table-column>
        <el-table-column label="实付金额" width="110">
          <template #default="{ row }">{{ row.actualAmount == null ? '-' : `￥${row.actualAmount}` }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusOf(row.status).type">{{ statusOf(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination v-model:current-page="query.page" v-model:page-size="query.size" :total="total"
        :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" class="pager"
        @current-change="loadList" @size-change="search" />
    </el-card>

    <!-- 订单详情抽屉 -->
    <el-drawer v-model="detailVisible" title="订单详情" size="440px">
      <el-descriptions v-if="current" :column="1" border>
        <el-descriptions-item label="订单号">{{ current.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ current.productName }}</el-descriptions-item>
        <el-descriptions-item label="商品 ID">{{ current.productId }}</el-descriptions-item>
        <el-descriptions-item label="用户 ID">{{ current.userId }}</el-descriptions-item>
        <el-descriptions-item label="购买数量">{{ current.quantity }}</el-descriptions-item>
        <el-descriptions-item label="预付金额">￥{{ current.prepaidAmount }}</el-descriptions-item>
        <el-descriptions-item label="实付金额">
          {{ current.actualAmount == null ? '-' : `￥${current.actualAmount}` }}
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="statusOf(current.status).type">{{ statusOf(current.status).label }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ current.payTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ current.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ current.updateTime || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<style scoped>
.page {
  padding: 0;
}
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.w200 {
  width: 200px;
}
.w140 {
  width: 140px;
}
.pager {
  margin-top: 12px;
  justify-content: flex-end;
}
</style>
