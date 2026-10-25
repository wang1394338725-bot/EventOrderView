<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { cancelOrder, pageOrders, payOrder } from '../../api/order'
import type { Order } from '../../api/order'
import { USER_TOKEN_KEY } from '../../api/request'

/**
 * 我的订单页：Tab 切状态 + 支付/取消 + SSE 实时状态推送
 *
 * SSE：EventSource 无法自定义请求头，故 token 走查询参数 ?token=xxx（后端仅对该路径放行）。
 * 服务端连接超时 5 分钟会主动断开，EventSource 会自动重连，无需前端心跳。
 */
const tabs = [
  { label: '全部', name: 'all', status: undefined as number | undefined },
  { label: '待支付', name: 'pending', status: 0 },
  { label: '处理中', name: 'processing', status: 1 },
  { label: '待交付', name: 'deliver', status: 5 },
  { label: '已完成', name: 'success', status: 2 },
  { label: '已取消', name: 'cancelled', status: 6 },
]

const statusMap: Record<number, { label: string; type: 'info' | 'warning' | 'success' | 'danger' | 'primary' }> = {
  0: { label: '待支付', type: 'info' },
  1: { label: '处理中', type: 'warning' },
  2: { label: '成功', type: 'success' },
  3: { label: '失败', type: 'danger' },
  4: { label: '支付超时', type: 'info' },
  5: { label: '待交付', type: 'primary' },
  6: { label: '已取消', type: 'info' },
}

function statusOf(status: number) {
  return statusMap[status] ?? { label: `未知(${status})`, type: 'info' as const }
}

const activeTab = ref('all')
const list = ref<Order[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(10)
const loading = ref(false)

/** 当前 Tab 对应的状态筛选值（全部 = undefined） */
function currentStatus(): number | undefined {
  return tabs.find((t) => t.name === activeTab.value)?.status
}

async function loadList() {
  loading.value = true
  try {
    const res = await pageOrders({ page: page.value, size: size.value, status: currentStatus() })
    list.value = res.data.records
    total.value = res.data.total
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

watch(activeTab, () => {
  page.value = 1
  loadList()
})

async function pay(row: Order) {
  try {
    const res = await payOrder(row.orderNo)
    // 接口返回的是"处理中"，最终结果以 SSE 推送为准
    ElMessage.warning(res.data.tip || '支付处理中')
    loadList()
  } catch (e) {
    ElMessage.error((e as Error).message)
  }
}

async function cancel(row: Order) {
  try {
    await ElMessageBox.confirm(`确认取消订单 ${row.orderNo}？将退回已付金额并回补库存。`, '提示', {
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await cancelOrder(row.orderNo)
    ElMessage.success('已取消')
    loadList()
  } catch (e) {
    ElMessage.error((e as Error).message)
  }
}

// ---------- SSE 订阅 ----------
let eventSource: EventSource | null = null

function subscribe() {
  const token = localStorage.getItem(USER_TOKEN_KEY)
  if (!token) return
  eventSource = new EventSource(`/api/orders/events?token=${encodeURIComponent(token)}`)

  eventSource.addEventListener('order-status', (ev) => {
    const data = JSON.parse((ev as MessageEvent).data) as {
      orderNo: string
      status: number
      message: string
    }
    // 命中当前页则就地更新，避免整页闪烁
    const row = list.value.find((o) => o.orderNo === data.orderNo)
    if (row) row.status = data.status
    ElMessage.info(`订单 ${data.orderNo}：${data.message || statusOf(data.status).label}`)
    // 若当前 Tab 已不再包含该状态（如"处理中"→"待交付"），重新拉取保证列表一致
    if (currentStatus() !== undefined && currentStatus() !== data.status) loadList()
  })

  // 服务端 5 分钟超时断开属正常现象，EventSource 默认会自动重连，此处不主动关闭
  eventSource.onerror = () => {}
}

onMounted(() => {
  loadList()
  subscribe()
})

onUnmounted(() => {
  eventSource?.close()
  eventSource = null
})
</script>

<template>
  <div class="orders">
    <h2 class="page-title">我的订单</h2>
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane v-for="t in tabs" :key="t.name" :label="t.label" :name="t.name">
        <el-table v-loading="loading" :data="list" border stripe>
          <el-table-column prop="orderNo" label="订单号" min-width="180" show-overflow-tooltip />
          <el-table-column prop="productName" label="商品" min-width="140" show-overflow-tooltip />
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column label="金额" width="110">
            <template #default="{ row }">
              ￥{{ row.actualAmount ?? row.prepaidAmount }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="statusOf(row.status).type">{{ statusOf(row.status).label }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="下单时间" width="170" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === 0" link type="primary" @click="pay(row)">支付</el-button>
              <el-button v-if="row.status === 5" link type="danger" @click="cancel(row)">取消</el-button>
              <span v-if="row.status !== 0 && row.status !== 5" class="no-op">—</span>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination v-model:current-page="page" v-model:page-size="size" :total="total"
          :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" class="pager"
          @current-change="loadList" @size-change="page = 1; loadList()" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.orders {
  max-width: 1100px;
  margin: 0 auto;
}
.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
}
.pager {
  margin-top: 12px;
  justify-content: flex-end;
}
.no-op {
  color: var(--el-text-color-placeholder);
}
</style>
