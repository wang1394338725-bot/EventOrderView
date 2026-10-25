<script setup lang="ts">
import { computed, ref } from 'vue'
import type { EChartsCoreOption } from 'echarts/core'
import {
  ArrowDown,
  ArrowUp,
  Goods,
  ShoppingCart,
  Tickets,
  Wallet,
} from '@element-plus/icons-vue'
import EChart from '../../components/EChart.vue'

/**
 * 数据看板页（管理端）：平台经营数据一览
 * 布局参考电商后台通行设计：顶部 KPI 指标卡 → 收支趋势 → 占比/排行
 * 纯静态页面：全部数据为模拟数据，仅展示效果，后续接统计接口整体替换
 */

// ==================== 模拟数据区（接接口后删除） ====================
const DAY_MS = 24 * 60 * 60 * 1000

/** 生成最近 n 天的模拟收支数据：周末偏高，波形固定（非随机，保证每次渲染一致） */
function mockDailyBalance(days: number) {
  const dates: string[] = []
  const recharge: number[] = []
  const consume: number[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS)
    dates.push(
      `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    )
    const weekendBoost = d.getDay() === 0 || d.getDay() === 6 ? 1.4 : 1
    recharge.push(Math.round((900 + 500 * Math.abs(Math.sin(i * 1.7))) * weekendBoost))
    consume.push(Math.round((1500 + 900 * Math.abs(Math.cos(i * 1.3))) * weekendBoost))
  }
  return { dates, recharge, consume }
}

const dailyAll = mockDailyBalance(30)

/** KPI 指标卡（今日充值 / 今日消费 / 今日订单 / 在售商品） */
const kpiCards = [
  { key: 'recharge', label: '今日充值', value: '¥1,286.00', trend: 12.4, icon: Wallet, color: '#409eff' },
  { key: 'consume', label: '今日消费', value: '¥3,452.50', trend: -3.1, icon: ShoppingCart, color: '#f56c6c' },
  { key: 'orders', label: '今日订单', value: '56', trend: 8.0, icon: Tickets, color: '#67c23a' },
  { key: 'products', label: '在售商品', value: '128', trend: null, icon: Goods, color: '#e6a23c' },
] as const

/** 订单状态分布（对应 orders 表单字段状态机） */
const orderStatusData = [
  { name: '待支付', value: 18, color: '#e6a23c' },
  { name: '处理中', value: 12, color: '#409eff' },
  { name: '成功', value: 236, color: '#67c23a' },
  { name: '失败', value: 9, color: '#f56c6c' },
  { name: '支付超时', value: 25, color: '#909399' },
  { name: '待交付', value: 31, color: '#36cfc9' },
  { name: '已取消', value: 11, color: '#c0c4cc' },
]
const orderTotal = orderStatusData.reduce((sum, item) => sum + item.value, 0)

/** 商品销量 Top5（对应 orders 表商品名称快照聚合） */
const topProducts = [
  { name: '机械键盘 K870 青轴', value: 86 },
  { name: '无线鼠标 M2 静音版', value: 72 },
  { name: '27寸显示器 2K', value: 54 },
  { name: 'USB-C 扩展坞 八合一', value: 41 },
  { name: '笔记本支架 铝合金', value: 33 },
]
// ==================== 模拟数据区结束 ====================

/** 收支曲线时间范围 */
const rangeDays = ref<7 | 30>(7)

/** 每日收支曲线：收入=充值（绿），支出=扣款（红），口径已拍板 */
const balanceTrendOption = computed<EChartsCoreOption>(() => {
  const { dates, recharge, consume } = dailyAll
  const start = dates.length - rangeDays.value
  return {
    color: ['#67c23a', '#f56c6c'],
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: number) => `¥${value.toLocaleString()}`,
    },
    legend: { data: ['充值收入', '消费支出'], right: 0, top: 0 },
    grid: { left: 8, right: 16, top: 36, bottom: 0, containLabel: true },
    xAxis: {
      type: 'category',
      data: dates.slice(start),
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisTick: { show: false },
      axisLabel: { color: '#909399' },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#909399', formatter: (v: number) => (v >= 1000 ? `${v / 1000}k` : v) },
      splitLine: { lineStyle: { color: '#ebeef5' } },
    },
    series: [
      {
        name: '充值收入',
        type: 'line',
        data: recharge.slice(start),
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2.5 },
        areaStyle: {
          opacity: 0.12,
        },
      },
      {
        name: '消费支出',
        type: 'line',
        data: consume.slice(start),
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2.5 },
        areaStyle: {
          opacity: 0.12,
        },
      },
    ],
  }
})

/** 订单状态分布环形图：中心显示订单总数，图例竖排在右 */
const orderStatusOption = computed<EChartsCoreOption>(() => ({
  color: orderStatusData.map((item) => item.color),
  tooltip: {
    trigger: 'item',
    formatter: '{b}：{c} 单（{d}%）',
  },
  legend: {
    orient: 'vertical',
    right: 12,
    top: 'center',
    icon: 'circle',
    itemWidth: 8,
    itemHeight: 8,
    textStyle: { color: '#606266' },
  },
  title: {
    text: String(orderTotal),
    subtext: '订单总数',
    left: '30%',
    top: '40%',
    textAlign: 'center',
    itemGap: 4,
    textStyle: { fontSize: 28, fontWeight: 700, color: '#303133' },
    subtextStyle: { fontSize: 13, color: '#909399' },
  },
  series: [
    {
      type: 'pie',
      radius: ['58%', '80%'],
      center: ['30%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        scaleSize: 6,
        label: { show: true, formatter: '{b}\n{c} 单', fontWeight: 600, color: '#303133' },
      },
      data: orderStatusData.map((item) => ({ name: item.name, value: item.value })),
    },
  ],
}))

/** 商品销量 Top5 横向柱状图：销量最高在最上 */
const topProductOption = computed<EChartsCoreOption>(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: '{b}：{c} 件',
  },
  grid: { left: 8, right: 40, top: 8, bottom: 0, containLabel: true },
  xAxis: {
    type: 'value',
    axisLabel: { color: '#909399' },
    splitLine: { lineStyle: { color: '#ebeef5' } },
  },
  yAxis: {
    type: 'category',
    inverse: true,
    data: topProducts.map((item) => item.name),
    axisTick: { show: false },
    axisLine: { show: false },
    axisLabel: {
      color: '#606266',
      width: 130,
      overflow: 'truncate',
    },
  },
  series: [
    {
      type: 'bar',
      data: topProducts.map((item) => item.value),
      barWidth: 16,
      itemStyle: {
        borderRadius: [0, 8, 8, 0],
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [
            { offset: 0, color: '#79bbff' },
            { offset: 1, color: '#409eff' },
          ],
        },
      },
      label: { show: true, position: 'right', color: '#606266' },
    },
  ],
}))
</script>

<template>
  <div class="page">
    <!-- 顶部 KPI 指标卡 -->
    <el-row :gutter="16">
      <el-col v-for="card in kpiCards" :key="card.key" :xs="12" :sm="12" :md="6">
        <div class="kpi-card">
          <div class="kpi-main">
            <span class="kpi-label">{{ card.label }}</span>
            <span class="kpi-value">{{ card.value }}</span>
            <span v-if="card.trend !== null" class="kpi-trend"
              :class="card.trend >= 0 ? 'trend-up' : 'trend-down'">
              <el-icon :size="12">
                <ArrowUp v-if="card.trend >= 0" />
                <ArrowDown v-else />
              </el-icon>
              {{ Math.abs(card.trend) }}%
              <em>较昨日</em>
            </span>
            <span v-else class="kpi-trend trend-flat">实时数据</span>
          </div>
          <div class="kpi-icon" :style="{ backgroundColor: `${card.color}1a`, color: card.color }">
            <el-icon :size="24"><component :is="card.icon" /></el-icon>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 每日收支曲线 -->
    <el-card shadow="never" class="chart-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">每日收支趋势</span>
          <el-radio-group v-model="rangeDays" size="small">
            <el-radio-button :value="7">近 7 天</el-radio-button>
            <el-radio-button :value="30">近 30 天</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <EChart :option="balanceTrendOption" height="320px" />
    </el-card>

    <!-- 订单状态分布 + 商品销量 Top5 -->
    <el-row :gutter="16">
      <el-col :xs="24" :md="10">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <span class="card-title">订单状态分布</span>
          </template>
          <EChart :option="orderStatusOption" height="300px" />
        </el-card>
      </el-col>
      <el-col :xs="24" :md="14">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <span class="card-title">商品销量 Top 5</span>
          </template>
          <EChart :option="topProductOption" height="300px" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ---- KPI 指标卡 ---- */
.kpi-card {
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: box-shadow 0.2s;
}
.kpi-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.kpi-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.kpi-label {
  font-size: 13px;
  color: #909399;
}
.kpi-value {
  font-size: 26px;
  font-weight: 700;
  color: #303133;
  font-variant-numeric: tabular-nums;
}
.kpi-trend {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-style: normal;
}
.kpi-trend em {
  font-style: normal;
  color: #c0c4cc;
  margin-left: 4px;
}
.trend-up {
  color: #67c23a;
}
.trend-down {
  color: #f56c6c;
}
.trend-flat {
  color: #c0c4cc;
}
.kpi-icon {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ---- 图表卡片 ---- */
.chart-card {
  border: 1px solid var(--el-border-color-lighter);
}
.chart-card :deep(.el-card__header) {
  padding: 14px 20px;
}
.chart-card :deep(.el-card__body) {
  padding: 8px 12px 12px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
</style>
