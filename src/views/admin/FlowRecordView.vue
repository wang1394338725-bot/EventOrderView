<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { pageBalanceFlows, pageOperationLogs, pageStockFlows } from '../../api/flow'
import type { BalanceFlow, OperationLog, StockFlow } from '../../api/flow'

/**
 * 流水记录页（管理端）：余额流水 / 库存流水 / 操作日志 三张只读表
 * 三张表均"只插不改"，管理端只查询、不提供增删改
 */
const activeTab = ref<'balance' | 'stock' | 'operation'>('balance')

/** 余额流水变动类型：1充值 2扣款 3退款 4回滚 */
const balanceTypes = [
  { label: '充值', value: 1 },
  { label: '支付扣款', value: 2 },
  { label: '取消退款', value: 3 },
  { label: '系统回滚', value: 4 },
]
/** 库存流水变动类型：1下单扣减 2取消回补 3超时或失败回补 4入库 */
const stockTypes = [
  { label: '下单扣减', value: 1 },
  { label: '取消回补', value: 2 },
  { label: '超时/失败回补', value: 3 },
  { label: '入库', value: 4 },
]

function typeLabel(options: { label: string; value: number }[], value: number) {
  return options.find((o) => o.value === value)?.label ?? `未知(${value})`
}

// ---------- 余额流水 ----------
const balanceQuery = reactive({ userId: undefined as number | undefined, orderNo: '', changeType: undefined as number | undefined })
const balanceList = ref<BalanceFlow[]>([])
const balanceTotal = ref(0)
const balancePage = ref(1)
const balanceSize = ref(20)

// ---------- 库存流水 ----------
const stockQuery = reactive({ productId: undefined as number | undefined, orderNo: '', changeType: undefined as number | undefined })
const stockList = ref<StockFlow[]>([])
const stockTotal = ref(0)
const stockPage = ref(1)
const stockSize = ref(20)

// ---------- 操作日志 ----------
const operationQuery = reactive({ adminId: undefined as number | undefined, opType: '' })
const operationList = ref<OperationLog[]>([])
const operationTotal = ref(0)
const operationPage = ref(1)
const operationSize = ref(20)
/** 操作类型字典（与后端 AppConstants.OperationType 一一对应） */
const opTypeOptions = [
  { value: 'ADMIN_LOGIN', label: '管理员登录' },
  { value: 'PRODUCT_CREATE', label: '新增商品' },
  { value: 'PRODUCT_UPDATE', label: '编辑商品' },
  { value: 'PRODUCT_UP', label: '商品上架' },
  { value: 'PRODUCT_DOWN', label: '商品下架' },
  { value: 'STOCK_IN', label: '商品入库' },
  { value: 'ADMIN_CREATE', label: '新增管理员' },
  { value: 'ADMIN_UPDATE', label: '编辑管理员' },
  { value: 'ADMIN_DELETE', label: '删除管理员' },
  { value: 'ADMIN_RESET_PASSWORD', label: '重置管理员密码' },
]

function opTypeLabel(value: string) {
  return opTypeOptions.find((o) => o.value === value)?.label ?? value
}

const loading = ref(false)

async function loadBalance() {
  loading.value = true
  try {
    const res = await pageBalanceFlows({
      page: balancePage.value,
      size: balanceSize.value,
      userId: balanceQuery.userId,
      orderNo: balanceQuery.orderNo || undefined,
      changeType: balanceQuery.changeType,
    })
    balanceList.value = res.data.records
    balanceTotal.value = res.data.total
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

async function loadStock() {
  loading.value = true
  try {
    const res = await pageStockFlows({
      page: stockPage.value,
      size: stockSize.value,
      productId: stockQuery.productId,
      orderNo: stockQuery.orderNo || undefined,
      changeType: stockQuery.changeType,
    })
    stockList.value = res.data.records
    stockTotal.value = res.data.total
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

async function loadOperation() {
  loading.value = true
  try {
    const res = await pageOperationLogs({
      page: operationPage.value,
      size: operationSize.value,
      adminId: operationQuery.adminId,
      opType: operationQuery.opType || undefined,
    })
    operationList.value = res.data.records
    operationTotal.value = res.data.total
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

/** 各 Tab 首次激活时才拉取，避免进页面就打三个接口 */
const loaded = { balance: false, stock: false, operation: false }
function loadCurrent() {
  if (activeTab.value === 'balance') return loadBalance()
  if (activeTab.value === 'stock') return loadStock()
  return loadOperation()
}

watch(activeTab, () => {
  if (loaded[activeTab.value]) return
  loaded[activeTab.value] = true
  loadCurrent()
})

onMounted(() => {
  loaded.balance = true
  loadBalance()
})
</script>

<template>
  <div class="page">
    <el-card shadow="never">
      <el-tabs v-model="activeTab">
        <!-- 余额流水 -->
        <el-tab-pane label="余额流水" name="balance">
          <div class="toolbar">
            <el-input-number v-model="balanceQuery.userId" :min="1" :controls="false" placeholder="用户 ID"
              class="w120" />
            <el-input v-model="balanceQuery.orderNo" placeholder="订单号" clearable class="w200"
              @keyup.enter="balancePage = 1; loadBalance()" />
            <el-select v-model="balanceQuery.changeType" placeholder="变动类型" clearable class="w140">
              <el-option v-for="t in balanceTypes" :key="t.value" :label="t.label" :value="t.value" />
            </el-select>
            <el-button type="primary" @click="balancePage = 1; loadBalance()">查询</el-button>
          </div>
          <el-table v-loading="loading" :data="balanceList" border stripe>
            <el-table-column prop="id" label="ID" width="64" />
            <el-table-column prop="userId" label="用户 ID" width="90" />
            <el-table-column label="变动类型" width="120">
              <template #default="{ row }">
                <el-tag>{{ typeLabel(balanceTypes, row.changeType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="变动金额" width="110">
              <template #default="{ row }">￥{{ row.amount }}</template>
            </el-table-column>
            <el-table-column label="变动前余额" width="120">
              <template #default="{ row }">￥{{ row.beforeBalance }}</template>
            </el-table-column>
            <el-table-column label="变动后余额" width="120">
              <template #default="{ row }">￥{{ row.afterBalance }}</template>
            </el-table-column>
            <el-table-column prop="orderNo" label="关联订单号" min-width="180" show-overflow-tooltip />
            <el-table-column prop="createTime" label="时间" width="170" />
          </el-table>
          <el-pagination v-model:current-page="balancePage" v-model:page-size="balanceSize" :total="balanceTotal"
            :page-sizes="[20, 50, 100]" layout="total, sizes, prev, pager, next" class="pager"
            @current-change="loadBalance" @size-change="balancePage = 1; loadBalance()" />
        </el-tab-pane>

        <!-- 库存流水 -->
        <el-tab-pane label="库存流水" name="stock">
          <div class="toolbar">
            <el-input-number v-model="stockQuery.productId" :min="1" :controls="false" placeholder="商品 ID"
              class="w120" />
            <el-input v-model="stockQuery.orderNo" placeholder="订单号" clearable class="w200"
              @keyup.enter="stockPage = 1; loadStock()" />
            <el-select v-model="stockQuery.changeType" placeholder="变动类型" clearable class="w160">
              <el-option v-for="t in stockTypes" :key="t.value" :label="t.label" :value="t.value" />
            </el-select>
            <el-button type="primary" @click="stockPage = 1; loadStock()">查询</el-button>
          </div>
          <el-table v-loading="loading" :data="stockList" border stripe>
            <el-table-column prop="id" label="ID" width="64" />
            <el-table-column prop="productId" label="商品 ID" width="90" />
            <el-table-column label="变动类型" width="130">
              <template #default="{ row }">
                <el-tag type="warning">{{ typeLabel(stockTypes, row.changeType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="变动数量" width="100" />
            <el-table-column prop="beforeStock" label="变动前库存" width="110" />
            <el-table-column prop="afterStock" label="变动后库存" width="110" />
            <el-table-column prop="orderNo" label="关联订单号" min-width="180" show-overflow-tooltip />
            <el-table-column prop="createTime" label="时间" width="170" />
          </el-table>
          <el-pagination v-model:current-page="stockPage" v-model:page-size="stockSize" :total="stockTotal"
            :page-sizes="[20, 50, 100]" layout="total, sizes, prev, pager, next" class="pager"
            @current-change="loadStock" @size-change="stockPage = 1; loadStock()" />
        </el-tab-pane>

        <!-- 操作日志 -->
        <el-tab-pane label="操作日志" name="operation">
          <div class="toolbar">
            <el-input-number v-model="operationQuery.adminId" :min="1" :controls="false" placeholder="操作人 ID"
              class="w140" />
            <el-select v-model="operationQuery.opType" placeholder="操作类型" clearable class="w160"
              @change="operationPage = 1; loadOperation()">
              <el-option v-for="o in opTypeOptions" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
            <el-button type="primary" @click="operationPage = 1; loadOperation()">查询</el-button>
          </div>
          <el-table v-loading="loading" :data="operationList" border stripe>
            <el-table-column prop="id" label="ID" width="64" />
            <el-table-column prop="adminId" label="操作人" width="100" />
            <el-table-column label="操作类型" width="150">
              <template #default="{ row }">{{ opTypeLabel(row.opType) }}</template>
            </el-table-column>
            <el-table-column prop="opContent" label="操作内容" min-width="260" show-overflow-tooltip />
            <el-table-column prop="createTime" label="时间" width="170" />
          </el-table>
          <el-pagination v-model:current-page="operationPage" v-model:page-size="operationSize" :total="operationTotal"
            :page-sizes="[20, 50, 100]" layout="total, sizes, prev, pager, next" class="pager"
            @current-change="loadOperation" @size-change="operationPage = 1; loadOperation()" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
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

.w120 {
  width: 120px;
}

.w140 {
  width: 140px;
}

.w160 {
  width: 160px;
}

.w200 {
  width: 200px;
}

.w220 {
  width: 220px;
}

.pager {
  margin-top: 12px;
  justify-content: flex-end;
}
</style>
