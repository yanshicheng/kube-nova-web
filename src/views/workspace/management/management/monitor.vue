<!-- /views/workspace/management/monitor.vue -->
<template>
  <div class="monitor-panel">
    <!-- 时间选择器 -->
    <div class="time-selector">
      <ElRadioGroup v-model="timeRange" @change="handleTimeRangeChange" size="default">
        <ElRadioButton value="1h">1小时</ElRadioButton>
        <ElRadioButton value="6h">6小时</ElRadioButton>
        <ElRadioButton value="12h">12小时</ElRadioButton>
        <ElRadioButton value="1d">1天</ElRadioButton>
        <ElRadioButton value="7d">7天</ElRadioButton>
      </ElRadioGroup>
      <ElButton :icon="Refresh" @click="refreshData">刷新数据</ElButton>
    </div>

    <!-- 指标卡片 -->
    <ElRow :gutter="16" class="metric-cards">
      <ElCol :span="6" v-for="metric in currentMetrics" :key="metric.name">
        <div class="metric-card" :class="`metric-${metric.type}`">
          <div class="metric-header">
            <ElIcon :size="24"><component :is="metric.icon" /></ElIcon>
            <span class="metric-name">{{ metric.name }}</span>
          </div>
          <div class="metric-value">{{ metric.value }}</div>
          <div class="metric-trend">
            <span :class="['trend', metric.trend > 0 ? 'up' : 'down']">
              <ElIcon><ArrowUp v-if="metric.trend > 0" /><ArrowDown v-else /></ElIcon>
              {{ Math.abs(metric.trend) }}%
            </span>
            <span class="trend-text">较昨日</span>
          </div>
        </div>
      </ElCol>
    </ElRow>

    <!-- 图表网格 -->
    <div class="charts-grid">
      <div class="chart-card">
        <h3 class="chart-title">CPU 使用率</h3>
        <div ref="cpuChartRef" class="chart-container"></div>
      </div>

      <div class="chart-card">
        <h3 class="chart-title">内存使用率</h3>
        <div ref="memoryChartRef" class="chart-container"></div>
      </div>

      <div class="chart-card">
        <h3 class="chart-title">网络流量</h3>
        <div ref="networkChartRef" class="chart-container"></div>
      </div>

      <div class="chart-card">
        <h3 class="chart-title">Pod 数量</h3>
        <div ref="podChartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 事件日志 -->
    <ElCard class="event-log-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>最近事件</span>
          <ElTag size="small">{{ eventLogs.length }}</ElTag>
        </div>
      </template>
      <ElTimeline>
        <ElTimelineItem
          v-for="event in eventLogs"
          :key="event.id"
          :timestamp="event.timestamp"
          :type="event.type"
          placement="top"
        >
          <div class="event-content">
            <h4>{{ event.title }}</h4>
            <p>{{ event.description }}</p>
          </div>
        </ElTimelineItem>
      </ElTimeline>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import {
  Refresh,
  Cpu,
  Memo,
  Connection,
  Box,
  ArrowUp,
  ArrowDown
} from '@element-plus/icons-vue'
import type { ProjectWorkspace } from '@/api'

interface Props {
  workspace: ProjectWorkspace | null
}

defineProps<Props>()

// 状态
const timeRange = ref('1h')
const cpuChartRef = ref<HTMLElement>()
const memoryChartRef = ref<HTMLElement>()
const networkChartRef = ref<HTMLElement>()
const podChartRef = ref<HTMLElement>()

let charts: Record<string, echarts.ECharts> = {}

// 模拟指标数据
const currentMetrics = ref([
  {
    name: 'CPU 使用率',
    value: '65.2%',
    trend: 5.3,
    type: 'cpu',
    icon: Cpu
  },
  {
    name: '内存使用率',
    value: '78.5%',
    trend: -2.1,
    type: 'memory',
    icon: Memo
  },
  {
    name: '网络流入',
    value: '125MB/s',
    trend: 12.5,
    type: 'network',
    icon: Connection
  },
  {
    name: 'Pod 数量',
    value: '42/100',
    trend: 8.0,
    type: 'pods',
    icon: Box
  }
])

// 模拟事件日志
const eventLogs = ref([
  {
    id: 1,
    title: 'Pod 自动扩容',
    description: 'Deployment nginx-app 从 3 个副本扩容到 5 个副本',
    timestamp: new Date().toLocaleString(),
    type: 'success'
  },
  {
    id: 2,
    title: '内存告警',
    description: 'Pod redis-master-0 内存使用率超过 80% 阈值',
    timestamp: new Date(Date.now() - 3600000).toLocaleString(),
    type: 'warning'
  },
  {
    id: 3,
    title: 'ConfigMap 更新',
    description: '配置项 app-config 已更新并重新加载',
    timestamp: new Date(Date.now() - 7200000).toLocaleString(),
    type: 'primary'
  }
])

// 生成模拟数据
const generateTimeData = (points = 60) => {
  const data: string[] = []
  const now = new Date()
  for (let i = points - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000)
    data.push(time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))
  }
  return data
}

const generateRandomData = (points = 60, min = 0, max = 100) => {
  const data: number[] = []
  for (let i = 0; i < points; i++) {
    data.push(parseFloat((Math.random() * (max - min) + min).toFixed(2)))
  }
  return data
}

// 初始化图表
const initCharts = async () => {
  await nextTick()

  const timeData = generateTimeData()
  const chartTheme = {
    color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c'],
    backgroundColor: 'transparent',
    textStyle: {
      color: '#606266'
    }
  }

  // CPU图表
  if (cpuChartRef.value) {
    charts.cpu = echarts.init(cpuChartRef.value)
    charts.cpu.setOption({
      ...chartTheme,
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: timeData,
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: { formatter: '{value}%' }
      },
      series: [{
        name: 'CPU使用率',
        type: 'line',
        smooth: true,
        data: generateRandomData(60, 40, 80),
        areaStyle: { opacity: 0.3 }
      }],
      grid: { left: '10%', right: '5%', top: '10%', bottom: '15%' }
    })
  }

  // 内存图表
  if (memoryChartRef.value) {
    charts.memory = echarts.init(memoryChartRef.value)
    charts.memory.setOption({
      ...chartTheme,
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: timeData,
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: { formatter: '{value}%' }
      },
      series: [{
        name: '内存使用率',
        type: 'line',
        smooth: true,
        data: generateRandomData(60, 60, 85),
        areaStyle: { opacity: 0.3 },
        lineStyle: { color: '#67c23a' },
        itemStyle: { color: '#67c23a' }
      }],
      grid: { left: '10%', right: '5%', top: '10%', bottom: '15%' }
    })
  }

  // 网络流量图表
  if (networkChartRef.value) {
    charts.network = echarts.init(networkChartRef.value)
    charts.network.setOption({
      ...chartTheme,
      tooltip: { trigger: 'axis' },
      legend: { data: ['流入', '流出'], bottom: 0 },
      xAxis: {
        type: 'category',
        data: timeData,
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: '{value} MB/s' }
      },
      series: [
        {
          name: '流入',
          type: 'line',
          smooth: true,
          data: generateRandomData(60, 50, 150)
        },
        {
          name: '流出',
          type: 'line',
          smooth: true,
          data: generateRandomData(60, 30, 120),
          lineStyle: { color: '#e6a23c' },
          itemStyle: { color: '#e6a23c' }
        }
      ],
      grid: { left: '10%', right: '5%', top: '10%', bottom: '15%' }
    })
  }

  // Pod数量图表
  if (podChartRef.value) {
    charts.pod = echarts.init(podChartRef.value)
    charts.pod.setOption({
      ...chartTheme,
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: timeData,
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        max: 100
      },
      series: [{
        name: 'Pod数量',
        type: 'line',
        smooth: true,
        data: generateRandomData(60, 30, 60),
        areaStyle: { opacity: 0.3, color: '#f56c6c' },
        lineStyle: { color: '#f56c6c' },
        itemStyle: { color: '#f56c6c' }
      }],
      grid: { left: '10%', right: '5%', top: '10%', bottom: '15%' }
    })
  }

  // 响应式
  window.addEventListener('resize', handleResize)
}

// 处理窗口大小变化
const handleResize = () => {
  Object.values(charts).forEach(chart => chart.resize())
}

// 处理时间范围变化
const handleTimeRangeChange = () => {
  refreshData()
}

// 刷新数据
const refreshData = () => {
  // 重新生成数据并更新图表
  Object.values(charts).forEach(chart => chart.dispose())
  initCharts()

  // 更新指标数据
  currentMetrics.value.forEach(metric => {
    metric.trend = (Math.random() - 0.5) * 20
  })
}

onMounted(() => {
  initCharts()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  Object.values(charts).forEach(chart => chart.dispose())
})
</script>

<style lang="scss" scoped>
.monitor-panel {
  .time-selector {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .metric-cards {
    margin-bottom: 24px;

    .metric-card {
      padding: 16px;
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      &.metric-cpu {
        border-left: 3px solid #409eff;
      }

      &.metric-memory {
        border-left: 3px solid #67c23a;
      }

      &.metric-network {
        border-left: 3px solid #e6a23c;
      }

      &.metric-pods {
        border-left: 3px solid #f56c6c;
      }

      .metric-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;

        .metric-name {
          font-size: 14px;
          color: var(--el-text-color-secondary);
        }
      }

      .metric-value {
        font-size: 24px;
        font-weight: bold;
        color: var(--el-text-color-primary);
        margin-bottom: 8px;
      }

      .metric-trend {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;

        .trend {
          display: flex;
          align-items: center;

          &.up {
            color: #f56c6c;
          }

          &.down {
            color: #67c23a;
          }
        }

        .trend-text {
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 24px;

    .chart-card {
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
      padding: 16px;

      .chart-title {
        margin: 0 0 16px;
        font-size: 16px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }

      .chart-container {
        width: 100%;
        height: 250px;
      }
    }
  }

  .event-log-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .event-content {
      h4 {
        margin: 0 0 4px;
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }

      p {
        margin: 0;
        font-size: 13px;
        color: var(--el-text-color-regular);
      }
    }
  }
}
</style>