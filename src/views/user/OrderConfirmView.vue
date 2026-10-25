<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { getProductDetail } from '../../api/product'
import type { ProductDetail } from '../../api/product'
import { createOrder } from '../../api/order'

/**
 * 订单确认页：按 ?productId=&quantity= 拉商品快照，提交下单
 * 下单成功后跳「我的订单」（等支付/取消操作在那里做）
 */
const route = useRoute()
const router = useRouter()

const product = ref<ProductDetail | null>(null)
const loading = ref(false)
const errorMsg = ref('')
/** 详情页带入的数量；不能直接作为输入框初值——商品未加载时 max 暂为 1，el-input-number 会把它夹成 1 */
const initialQuantity = Number(route.query.quantity) || 1
const buyQuantity = ref(1)
/** 提交中标记：防止重复点击产生多笔订单（后端 3 秒窗口为 check-then-act，前端禁用是必要兜底） */
const submitting = ref(false)
/**
 * 下单幂等键：进入确认页时生成一次，同一页面内的重复提交（双击、超时重试）共用它，
 * 后端 request_id 唯一索引保证只会落一笔订单
 */
const requestId = crypto.randomUUID()

const prepaidAmount = computed(() => {
  if (!product.value) return 0
  return Number((product.value.price * buyQuantity.value).toFixed(2))
})

async function loadDetail() {
  const id = Number(route.query.productId)
  if (!id) {
    errorMsg.value = '商品不存在或已下架'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await getProductDetail(id)
    product.value = res.data
    // 商品加载后按库存夹取详情页带入的数量（超出库存时取库存上限）
    buyQuantity.value = Math.min(Math.max(1, initialQuantity), Math.max(res.data.stock, 1))
  } catch (e) {
    product.value = null
    errorMsg.value = (e as Error).message || '商品不存在或已下架'
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!product.value || submitting.value) return
  submitting.value = true
  try {
    const res = await createOrder({
      requestId,
      productId: product.value.id,
      quantity: buyQuantity.value,
    })
    ElMessage.success(`下单成功，订单号 ${res.data}`)
    router.replace('/orders')
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    submitting.value = false
  }
}

onMounted(loadDetail)
</script>

<template>
  <div class="confirm">
    <h2 class="page-title">确认订单</h2>

    <!-- 商品不存在 / 已下架 -->
    <el-card v-if="errorMsg" shadow="never" class="card">
      <el-empty :description="errorMsg">
        <el-button type="primary" @click="router.push('/')">返回首页</el-button>
      </el-empty>
    </el-card>

    <template v-else>
      <el-card v-loading="loading" shadow="never" class="card">
        <template #header>
          <span class="card-header">商品信息</span>
        </template>
        <div v-if="product" class="goods-row">
          <div class="goods-cover">
            <el-image v-if="product.imageUrl" :src="product.imageUrl" fit="cover" class="cover-img" />
            <el-icon v-else :size="28">
              <Picture />
            </el-icon>
          </div>
          <div class="goods-info">
            <div class="goods-name">{{ product.name }}</div>
            <div class="goods-price">￥{{ product.price.toFixed(2) }} x {{ buyQuantity }}</div>
            <div class="goods-stock">库存：{{ product.stock }}</div>
          </div>
        </div>
      </el-card>

      <el-card shadow="never" class="card">
        <template #header>
          <span class="card-header">数量</span>
        </template>
        <el-input-number v-model="buyQuantity" :min="1" :max="product ? Math.max(product.stock, 1) : 1" :step="1"
          size="large" />
      </el-card>

      <el-card shadow="never" class="card">
        <template #header>
          <span class="card-header">金额</span>
        </template>
        <div class="money-row">
          <span>预付金额</span>
          <span class="amount">￥{{ prepaidAmount.toFixed(2) }}</span>
        </div>
        <div class="money-row">
          <span>实付金额</span>
          <span class="amount strong">￥{{ prepaidAmount.toFixed(2) }}</span>
        </div>
      </el-card>

      <div class="submit-row">
        <el-button type="danger" size="large" class="submit-btn" :loading="submitting"
          :disabled="!product || product.stock <= 0" @click="submit">
          {{ submitting ? '提交中...' : '提交订单' }}
        </el-button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.confirm {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.card {
  border-radius: 12px;
}

.card-header {
  font-weight: 600;
}

.goods-row {
  display: flex;
  gap: 16px;
  align-items: center;
}

.goods-cover {
  width: 80px;
  height: 80px;
  background: #fafafa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  color: var(--el-text-color-placeholder);
}

.cover-img {
  width: 100%;
  height: 100%;
  display: block;
}

.goods-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.goods-name {
  font-weight: 600;
  color: #303133;
}

.goods-price {
  color: #606266;
  font-size: 14px;
}

.goods-stock {
  color: #909399;
  font-size: 13px;
}

.money-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  font-size: 14px;
  color: #606266;
}

.money-row+.money-row {
  border-top: 1px dashed var(--el-border-color-light);
}

.amount {
  color: #f56c6c;
  font-weight: 600;
}

.amount.strong {
  font-size: 18px;
}

.submit-row {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}

.submit-btn {
  min-width: 160px;
}
</style>
