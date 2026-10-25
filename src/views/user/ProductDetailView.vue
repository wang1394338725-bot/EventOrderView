<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Picture } from '@element-plus/icons-vue'
import { getProductDetail } from '../../api/product'
import type { ProductDetail } from '../../api/product'

/**
 * 商品详情页：图片/价格/库存/描述展示 + 购买入口
 */
const route = useRoute()
const router = useRouter()

const product = ref<ProductDetail | null>(null)
const loading = ref(false)
const errorMsg = ref('')
const buyQuantity = ref(1)

async function loadDetail() {
  const id = Number(route.params.id)
  if (!id) {
    errorMsg.value = '商品不存在或已下架'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await getProductDetail(id)
    product.value = res.data
  } catch (e) {
    product.value = null
    errorMsg.value = (e as Error).message || '商品不存在或已下架'
  } finally {
    loading.value = false
  }
}

function buy() {
  if (!product.value) return
  router.push({
    path: '/orders/confirm',
    query: { productId: product.value.id, quantity: buyQuantity.value },
  })
}

onMounted(loadDetail)
</script>

<template>
  <div class="detail">
    <!-- 加载失败 / 商品不存在或已下架 -->
    <el-card v-if="errorMsg" shadow="never" class="card">
      <el-empty :description="errorMsg">
        <el-button type="primary" @click="router.push('/')">返回首页</el-button>
      </el-empty>
    </el-card>

    <el-card v-else v-loading="loading" shadow="never" class="card">
      <div v-if="product" class="detail-body">
        <!-- 左侧大图 -->
        <div class="cover">
          <el-image v-if="product.imageUrl" :src="product.imageUrl" fit="cover" class="cover-img">
            <template #error>
              <div class="img-fallback">
                <el-icon :size="48">
                  <Picture />
                </el-icon>
                <span>暂无图片</span>
              </div>
            </template>
          </el-image>
          <div v-else class="img-fallback">
            <el-icon :size="48">
              <Picture />
            </el-icon>
            <span>暂无图片</span>
          </div>
        </div>

        <!-- 右侧信息 -->
        <div class="info">
          <h1 class="title">{{ product.name }}</h1>
          <p class="desc">{{ product.description || '暂无商品描述' }}</p>
          <div class="price-row">
            <span class="price">￥{{ product.price.toFixed(2) }}</span>
          </div>
          <div class="meta">
            <span>库存：{{ product.stock }}</span>
            <span>商家：{{ product.merchantName }}</span>
          </div>
          <div class="buy-row">
            <el-input-number v-model="buyQuantity" :min="1" :max="Math.max(product.stock, 1)" :step="1" size="large" />
            <el-button type="danger" size="large" class="buy-btn" :disabled="product.stock <= 0" @click="buy">
              {{ product.stock <= 0 ? '已售罄' : '立即购买' }} </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.detail {
  max-width: 1100px;
  margin: 0 auto;
}

.card {
  border-radius: 12px;
}

.detail-body {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}

.cover {
  width: 400px;
  height: 400px;
  background: #fafafa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.cover-img {
  width: 100%;
  height: 100%;
  display: block;
}

.img-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--el-text-color-placeholder);
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 280px;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.desc {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
}

.price-row {
  background: #fff6f6;
  padding: 12px 16px;
  border-radius: 8px;
}

.price {
  font-size: 28px;
  color: #f56c6c;
  font-weight: 700;
}

.meta {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: #606266;
}

.buy-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}

.buy-btn {
  min-width: 160px;
}
</style>
