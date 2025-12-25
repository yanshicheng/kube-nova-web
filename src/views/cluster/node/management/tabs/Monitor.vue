<!-- views/cluster/node/management/tabs/Monitor.vue -->
<template>
  <div class="monitor-tab">
    <!-- 时间选择器 -->
    <div class="time-selector">
      <ElRadioGroup v-model="timeRange" @change="handleTimeRangeChange" size="default">
        <ElRadioButton value="1h">1小时</ElRadioButton>
        <ElRadioButton value="6h">6小时</ElRadioButton>
        <ElRadioButton value="12h">12小时</ElRadioButton>
        <ElRadioButton value="1d">1天</ElRadioButton>
        <ElRadioButton value="7d">7天</ElRadioButton>
        <ElRadioButton value="30d">30天</ElRadioButton>
      </ElRadioGroup>

      <ElButton :icon="Refresh" @click="refreshData">刷新数据</ElButton>
    </div>

    <!-- 指标图表 -->
    <div class="metrics-grid">
      <!-- CPU 使用率 -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-title">
            <ElIcon><Cpu /></ElIcon>
            CPU 使用率
          </span>
          <span class="metric-value" :class="getCpuStatusClass()"> {{ currentCpuUsage }}% </span>
        </div>
        <div ref="cpuChartRef" class="chart-container"></div>
      </div>

      <!-- 内存使用率 -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-title">
            <ElIcon><Memo /></ElIcon>
            内存使用率
          </span>
          <span class="metric-value" :class="getMemoryStatusClass()">
            {{ currentMemoryUsage }}%
          </span>
        </div>
        <div ref="memoryChartRef" class="chart-container"></div>
      </div>

      <!-- 磁盘 I/O -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-title">
            <ElIcon><Files /></ElIcon>
            磁盘 I/O
          </span>
          <span class="metric-value"> {{ currentDiskIO }} MB/s </span>
        </div>
        <div ref="diskChartRef" class="chart-container"></div>
      </div>

      <!-- 网络流量 -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-title">
            <ElIcon><Connection /></ElIcon>
            网络流量
          </span>
          <span class="metric-value"> {{ currentNetworkTraffic }} Mbps </span>
        </div>
        <div ref="networkChartRef" class="chart-container"></div>
      </div>

      <!-- Pod 数量 -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-title">
            <ElIcon><Box /></ElIcon>
            Pod 数量
          </span>
          <span class="metric-value"> {{ currentPodCount }} / {{ podCapacity }} </span>
        </div>
        <div ref="podChartRef" class="chart-container"></div>
      </div>

      <!-- 系统负载 -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-title">
            <ElIcon><DataLine /></ElIcon>
            系统负载
          </span>
          <span class="metric-value" :class="getLoadStatusClass()">
            {{ currentLoad }}
          </span>
        </div>
        <div ref="loadChartRef" class="chart-container"></div>
      </div>
    </div>

    <!-- 告警信息 -->
    <div class="alert-section" v-if="alerts.length > 0">
      <div class="alert-header">
        <ElIcon>
          <Warning />
        </ElIcon>
        活跃告警 ({{ alerts.length }})
      </div>
      <div class="alert-list">
        <div class="alert-item" v-for="alert in alerts" :key="alert.id">
          <div class="alert-content">
            <h4>{{ alert.title }}</h4>
            <p>{{ alert.description }}</p>
          </div>
          <ElTag :type="alert.severity" size="small">{{ alert.severityText }}</ElTag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, nextTick } from 'vue'
  import * as echarts from 'echarts'
  import {
    Refresh,
    Cpu,
    Memo,
    Files,
    Connection,
    Box,
    DataLine,
    Warning
  } from '@element-plus/icons-vue'
  import type { ClusterNodeDetail } from '@/api/manager/node'

  interface Props {
    nodeDetail: Partial<ClusterNodeDetail>
    nodeId: number
  }

  interface Alert {
    id: number
    title: string
    description: string
    severity: 'warning' | 'error' | 'info'
    severityText: string
  }

  const props = defineProps<Props>()

  // 图表引用
  const cpuChartRef = ref<HTMLElement>()
  const memoryChartRef = ref<HTMLElement>()
  const diskChartRef = ref<HTMLElement>()
  const networkChartRef = ref<HTMLElement>()
  const podChartRef = ref<HTMLElement>()
  const loadChartRef = ref<HTMLElement>()

  // 图表实例
  let charts: Record<string, echarts.ECharts> = {}

  // 状态数据
  const timeRange = ref('1h')
  const currentCpuUsage = ref(65)
  const currentMemoryUsage = ref(78)
  const currentDiskIO = ref(125)
  const currentNetworkTraffic = ref(450)
  const currentPodCount = ref(45)
  const podCapacity = ref(110)
  const currentLoad = ref('2.45')

  const alerts = ref<Alert[]>([
    {
      id: 1,
      title: '内存使用率告警',
      description: '内存使用率超过 75% 阈值',
      severity: 'warning',
      severityText: '警告'
    }
  ])

  let refreshInterval: NodeJS.Timeout | null = null

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
          boundaryGap: false,
          axisLine: { lineStyle: { color: '#dcdfe6' } }
        },
        yAxis: {
          type: 'value',
          max: 100,
          axisLabel: { formatter: '{value}%' },
          axisLine: { lineStyle: { color: '#dcdfe6' } }
        },
        series: [
          {
            name: 'CPU使用率',
            type: 'line',
            smooth: true,
            data: generateRandomData(60, 40, 80),
            areaStyle: { opacity: 0.3 },
            lineStyle: { width: 2 }
          }
        ],
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
          boundaryGap: false,
          axisLine: { lineStyle: { color: '#dcdfe6' } }
        },
        yAxis: {
          type: 'value',
          max: 100,
          axisLabel: { formatter: '{value}%' },
          axisLine: { lineStyle: { color: '#dcdfe6' } }
        },
        series: [
          {
            name: '内存使用率',
            type: 'line',
            smooth: true,
            data: generateRandomData(60, 60, 85),
            areaStyle: { opacity: 0.3 },
            lineStyle: { width: 2, color: '#67c23a' },
            itemStyle: { color: '#67c23a' }
          }
        ],
        grid: { left: '10%', right: '5%', top: '10%', bottom: '15%' }
      })
    }

    // 磁盘I/O图表
    if (diskChartRef.value) {
      charts.disk = echarts.init(diskChartRef.value)
      charts.disk.setOption({
        ...chartTheme,
        tooltip: { trigger: 'axis' },
        legend: { data: ['读取', '写入'], bottom: 0 },
        xAxis: {
          type: 'category',
          data: timeData,
          boundaryGap: false,
          axisLine: { lineStyle: { color: '#dcdfe6' } }
        },
        yAxis: {
          type: 'value',
          axisLabel: { formatter: '{value} MB/s' },
          axisLine: { lineStyle: { color: '#dcdfe6' } }
        },
        series: [
          {
            name: '读取',
            type: 'line',
            smooth: true,
            data: generateRandomData(60, 50, 150),
            lineStyle: { width: 2 }
          },
          {
            name: '写入',
            type: 'line',
            smooth: true,
            data: generateRandomData(60, 30, 120),
            lineStyle: { width: 2, color: '#e6a23c' },
            itemStyle: { color: '#e6a23c' }
          }
        ],
        grid: { left: '10%', right: '5%', top: '10%', bottom: '15%' }
      })
    }

    // 网络流量图表
    if (networkChartRef.value) {
      charts.network = echarts.init(networkChartRef.value)
      charts.network.setOption({
        ...chartTheme,
        tooltip: { trigger: 'axis' },
        legend: { data: ['入站', '出站'], bottom: 0 },
        xAxis: {
          type: 'category',
          data: timeData,
          boundaryGap: false,
          axisLine: { lineStyle: { color: '#dcdfe6' } }
        },
        yAxis: {
          type: 'value',
          axisLabel: { formatter: '{value} Mbps' },
          axisLine: { lineStyle: { color: '#dcdfe6' } }
        },
        series: [
          {
            name: '入站',
            type: 'line',
            smooth: true,
            data: generateRandomData(60, 200, 500),
            lineStyle: { width: 2 }
          },
          {
            name: '出站',
            type: 'line',
            smooth: true,
            data: generateRandomData(60, 150, 400),
            lineStyle: { width: 2, color: '#f56c6c' },
            itemStyle: { color: '#f56c6c' }
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
          boundaryGap: false,
          axisLine: { lineStyle: { color: '#dcdfe6' } }
        },
        yAxis: {
          type: 'value',
          max: 110,
          axisLine: { lineStyle: { color: '#dcdfe6' } }
        },
        series: [
          {
            name: 'Pod数量',
            type: 'line',
            smooth: true,
            data: generateRandomData(60, 30, 60),
            areaStyle: { opacity: 0.3, color: '#909399' },
            lineStyle: { width: 2, color: '#909399' },
            itemStyle: { color: '#909399' }
          }
        ],
        grid: { left: '10%', right: '5%', top: '10%', bottom: '15%' }
      })
    }

    // 系统负载图表
    if (loadChartRef.value) {
      charts.load = echarts.init(loadChartRef.value)
      charts.load.setOption({
        ...chartTheme,
        tooltip: { trigger: 'axis' },
        legend: { data: ['1分钟', '5分钟', '15分钟'], bottom: 0 },
        xAxis: {
          type: 'category',
          data: timeData,
          boundaryGap: false,
          axisLine: { lineStyle: { color: '#dcdfe6' } }
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: '#dcdfe6' } }
        },
        series: [
          {
            name: '1分钟',
            type: 'line',
            smooth: true,
            data: generateRandomData(60, 1, 4),
            lineStyle: { width: 2 }
          },
          {
            name: '5分钟',
            type: 'line',
            smooth: true,
            data: generateRandomData(60, 1, 3.5),
            lineStyle: { width: 2 }
          },
          {
            name: '15分钟',
            type: 'line',
            smooth: true,
            data: generateRandomData(60, 1, 3),
            lineStyle: { width: 2 }
          }
        ],
        grid: { left: '10%', right: '5%', top: '10%', bottom: '15%' }
      })
    }

    // 响应式
    window.addEventListener('resize', handleResize)
  }

  // 处理窗口大小变化
  const handleResize = () => {
    Object.values(charts).forEach((chart) => chart.resize())
  }

  // 更新数据
  const updateData = () => {
    currentCpuUsage.value = Math.floor(Math.random() * 40 + 40)
    currentMemoryUsage.value = Math.floor(Math.random() * 30 + 60)
    currentDiskIO.value = Math.floor(Math.random() * 100 + 50)
    currentNetworkTraffic.value = Math.floor(Math.random() * 300 + 200)
    currentPodCount.value = Math.floor(Math.random() * 30 + 30)
    currentLoad.value = (Math.random() * 3 + 1).toFixed(2)
  }

  // 状态样式
  const getCpuStatusClass = () => {
    if (currentCpuUsage.value >= 80) return 'status-danger'
    if (currentCpuUsage.value >= 60) return 'status-warning'
    return 'status-good'
  }

  const getMemoryStatusClass = () => {
    if (currentMemoryUsage.value >= 80) return 'status-danger'
    if (currentMemoryUsage.value >= 60) return 'status-warning'
    return 'status-good'
  }

  const getLoadStatusClass = () => {
    const load = parseFloat(currentLoad.value)
    if (load >= 4) return 'status-danger'
    if (load >= 2) return 'status-warning'
    return 'status-good'
  }

  // 处理时间范围变化
  const handleTimeRangeChange = () => {
    refreshData()
  }

  // 刷新数据
  const refreshData = () => {
    updateData()
    // 重新初始化图表
    Object.values(charts).forEach((chart) => chart.dispose())
    initCharts()
  }

  // 生命周期
  onMounted(() => {
    initCharts()
    updateData()

    // 设置自动刷新
    refreshInterval = setInterval(() => {
      updateData()
    }, 5000)
  })

  onUnmounted(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
    window.removeEventListener('resize', handleResize)
    Object.values(charts).forEach((chart) => chart.dispose())
  })
</script>

<style lang="scss" scoped>
  .monitor-tab {
    .time-selector {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 16px;
      background: var(--el-bg-color);
      border-radius: 8px;
      border: 1px solid var(--el-border-color-lighter);
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .metric-card {
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
      padding: 20px;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }

      .metric-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .metric-title {
          font-size: 16px;
          font-weight: 500;
          color: var(--el-text-color-primary);
          display: flex;
          align-items: center;
          gap: 8px;

          .el-icon {
            color: var(--el-color-primary);
          }
        }

        .metric-value {
          font-size: 24px;
          font-weight: bold;

          &.status-good {
            color: #67c23a;
          }

          &.status-warning {
            color: #e6a23c;
          }

          &.status-danger {
            color: #f56c6c;
          }
        }
      }

      .chart-container {
        width: 100%;
        height: 300px;
      }
    }

    .alert-section {
      margin-top: 24px;
      padding: 20px;
      background: #fef5e7;
      border-radius: 8px;
      border: 1px solid #f9e4b7;

      .alert-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        font-size: 16px;
        font-weight: 500;
        color: #e6a23c;

        .el-icon {
          font-size: 20px;
        }
      }

      .alert-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .alert-item {
          background: white;
          border-radius: 6px;
          padding: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;

          .alert-content {
            h4 {
              margin: 0 0 4px;
              font-size: 14px;
              font-weight: 500;
              color: var(--el-text-color-primary);
            }

            p {
              margin: 0;
              font-size: 12px;
              color: var(--el-text-color-secondary);
            }
          }
        }
      }
    }
  }
</style>
