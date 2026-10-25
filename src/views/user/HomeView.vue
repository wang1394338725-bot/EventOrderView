<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Picture, Search } from '@element-plus/icons-vue'
import { getProductList } from '../../api/product'
import type { ProductDetail } from '../../api/product'

/**
 * 商城首页：C 端商品列表 + 搜索 + 分页
 */
const router = useRouter()

const list = ref<ProductDetail[]>([])
const total = ref(0)
const loading = ref(false)
const failed = ref(false)
const query = reactive({ keyword: '', page: 1, size: 12 })

async function loadList() {
  loading.value = true
  failed.value = false
  try {
    const res = await getProductList({
      page: query.page,
      size: query.size,
      keyword: query.keyword || undefined,
    })
    list.value = res.data.records
    total.value = res.data.total
  } catch (e) {
    failed.value = true
    list.value = []
    total.value = 0
    ElMessage.error((e as Error).message)
  } finally {
    loading.value = false
  }
}

function search() {
  query.page = 1
  loadList()
}

function goDetail(id: number) {
  router.push(`/products/${id}`)
}

onMounted(loadList)
</script>

<template>
  <div class="home">
    <!-- 搜索横幅 -->
    <div class="hero">
      <el-input v-model="query.keyword" placeholder="搜索商品" clearable size="large" class="search-input"
        @keyup.enter="search">
        <template #append>
          <el-button type="primary" :icon="Search" @click="search">搜索</el-button>
        </template>
      </el-input>
    </div>

    <!-- 商品列表 -->
    <div class="section">
      <h2 class="section-title">全部商品</h2>

      <!-- 加载 / 失败 / 空态 -->
      <div v-loading="loading" class="list-wrap">
        <el-empty v-if="failed" description="商品加载失败，请稍后重试">
          <el-button type="primary" @click="loadList">重新加载</el-button>
        </el-empty>

        <el-empty v-else-if="!loading && list.length === 0" description="暂无商品" />

        <div v-else class="grid">
          <div v-for="item in list" :key="item.id" class="card" :class="{ sold: item.stock <= 0 }"
            @click="goDetail(item.id)">
            <div class="cover">
              <el-image v-if="item.imageUrl" :src="item.imageUrl" fit="cover" class="cover-img">
                <template #error>
                  <div class="img-fallback">
                    <el-icon :size="28"><Picture /></el-icon>
                    <span>暂无图片</span>
                  </div>
                </template>
              </el-image>
              <div v-else class="img-fallback">
                <el-icon :size="28"><Picture /></el-icon>
                <span>暂无图片</span>
              </div>
              <span v-if="item.stock <= 0" class="sold-tag">售罄</span>
            </div>
            <div class="card-body">
              <div class="name" :title="item.name">{{ item.name }}</div>
              <div class="bottom">
                <span class="price">￥{{ item.price.toFixed(2) }}</span>
                <span class="stock">库存：{{ item.stock }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <el-pagination v-model:current-page="query.page" v-model:page-size="query.size" :total="total"
      :page-sizes="[12, 24, 48]" layout="total, sizes, prev, pager, next" class="pager"
      @current-change="loadList" @size-change="search" />
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.hero {
  background: linear-gradient(135deg, #e6f0ff 0%, #f0f5ff 100%);
  border-radius: 12px;
  padding: 48px 24px;
  text-align: center;
}
.search-input {
  max-width: 600px;
  margin: 0 auto;
}
.section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
}
.list-wrap {
  min-height: 200px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.card {
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
  background: #fff;
}
.card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
.card.sold {
  filter: grayscale(1);
  opacity: 0.7;
}
.cover {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #fafafa;
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
  gap: 6px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}
.sold-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}
.card-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.name {
  font-size: 14px;
  color: #303133;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bottom {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.price {
  color: #f56c6c;
  font-size: 18px;
  font-weight: 700;
}
.stock {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.pager {
  justify-content: flex-end;
}
</style>
