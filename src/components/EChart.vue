<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import type { EChartsCoreOption } from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

/**
 * ECharts 通用包装组件（按需引入，只注册项目用到的图表与组件，控制打包体积）
 * 职责：初始化 / option 更新 / 容器尺寸自适应 / 销毁，纯展示无业务逻辑
 */
echarts.use([
  LineChart,
  PieChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer,
])

const props = withDefaults(
  defineProps<{
    option: EChartsCoreOption
    height?: string
  }>(),
  { height: '320px' },
)

const chartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null
let observer: ResizeObserver | null = null

onMounted(() => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  chart.setOption(props.option)
  // 容器尺寸变化（窗口缩放、侧边栏折叠等）时自适应
  observer = new ResizeObserver(() => chart?.resize())
  observer.observe(chartRef.value)
})

watch(
  () => props.option,
  (newOption) => {
    // notMerge=true：整体替换，避免旧 series 残留
    chart?.setOption(newOption, true)
  },
  { deep: true },
)

onBeforeUnmount(() => {
  observer?.disconnect()
  chart?.dispose()
  chart = null
})
</script>

<template>
  <div ref="chartRef" :style="{ width: '100%', height }" />
</template>
