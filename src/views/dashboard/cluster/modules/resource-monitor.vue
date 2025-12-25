<template>
  <div class="resource-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="header-left">
            <div class="icon-wrapper resource-icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M7,7H17V5H19V19H5V5H7V7M17,11V9L15,9V11H17M13,11V9H11V11H13M9,11V9H7V11H9M17,15V13H15V15H17M13,15V13H11V15H13M9,15V13H7V15H9M17,19V17H15V19H17M13,19V17H11V19H13M9,19V17H7V19H9Z"
                />
              </svg>
            </div>
            <div class="header-title">
              <h3>集群资源</h3>
              <p>CPU、内存、Pod、存储资源监控</p>
            </div>
          </div>
          <div class="header-stats">
            <div class="stat-badge cpu">
              <span class="label">CPU 使用率</span>
              <span class="value">{{ formatPercentage(resourceData?.cpu?.usagePercent) }}</span>
            </div>
            <div class="stat-badge memory">
              <span class="label">内存使用率</span>
              <span class="value">{{ formatPercentage(resourceData?.memory?.usagePercent) }}</span>
            </div>
            <div class="stat-badge pod">
              <span class="label">Pod 使用率</span>
              <span class="value">{{ formatPercentage(resourceData?.pods?.usagePercent) }}</span>
            </div>
          </div>
        </div>

        <!-- 资源详情卡片 -->
        <div class="resource-details">
          <ElRow :gutter="16">
            <ElCol :xs="24" :sm="12" :md="12" :lg="6">
              <div class="detail-card cpu-card">
                <div class="detail-icon">💻</div>
                <div class="detail-content">
                  <div class="detail-label">CPU 容量</div>
                  <div class="detail-value">
                    {{ formatCores(resourceData?.cpu?.capacity) }}
                  </div>
                  <div class="detail-usage">
                    已用: {{ formatCores(resourceData?.cpu?.usage) }}
                  </div>
                </div>
              </div>
            </ElCol>
            <ElCol :xs="24" :sm="12" :md="12" :lg="6">
              <div class="detail-card memory-card">
                <div class="detail-icon">💽</div>
                <div class="detail-content">
                  <div class="detail-label">内存容量</div>
                  <div class="detail-value">
                    {{ formatBytes(resourceData?.memory?.capacity) }}
                  </div>
                  <div class="detail-usage">
                    已用: {{ formatBytes(resourceData?.memory?.usage) }}
                  </div>
                </div>
              </div>
            </ElCol>
            <ElCol :xs="24" :sm="12" :md="12" :lg="6">
              <div class="detail-card pod-card">
                <div class="detail-icon">📦</div>
                <div class="detail-content">
                  <div class="detail-label">Pod 状态</div>
                  <div class="detail-value">
                    {{ resourceData?.pods?.running || 0 }} / {{ resourceData?.pods?.capacity || 0 }}
                  </div>
                  <div class="detail-usage">运行中 Pod</div>
                </div>
              </div>
            </ElCol>
            <ElCol :xs="24" :sm="12" :md="12" :lg="6">
              <div class="detail-card storage-card">
                <div class="detail-icon">💾</div>
                <div class="detail-content">
                  <div class="detail-label">存储容量</div>
                  <div class="detail-value">
                    {{ formatBytes(resourceData?.storage?.totalCapacityBytes) }}
                  </div>
                  <div class="detail-usage">
                    已用: {{ formatBytes(resourceData?.storage?.totalUsageBytes) }}
                  </div>
                </div>
              </div>
            </ElCol>
          </ElRow>
        </div>

        <!-- 图表区域 -->
        <div class="chart-section">
          <ElRow :gutter="16">
            <!-- CPU 趋势 -->
            <ElCol :xs="24" :lg="12">
              <div class="chart-container">
                <div class="chart-header">
                  <h4>
                    <ElIcon><TrendCharts /></ElIcon>
                    CPU 使用趋势
                  </h4>
                </div>
                <div ref="cpuChartRef" class="chart"></div>
              </div>
            </ElCol>

            <!-- 内存趋势 -->
            <ElCol :xs="24" :lg="12">
              <div class="chart-container">
                <div class="chart-header">
                  <h4>
                    <ElIcon><TrendCharts /></ElIcon>
                    内存使用趋势
                  </h4>
                </div>
                <div ref="memoryChartRef" class="chart"></div>
              </div>
            </ElCol>
          </ElRow>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <ElEmpty description="暂无资源监控数据" :image-size="150" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
  import { TrendCharts } from '@element-plus/icons-vue'
  import * as echarts from 'echarts'
  import type { ClusterResourceMetrics } from '@/api/console/cluster-monitor'
  import { formatBytes, formatCores, formatPercentage } from '@/utils/format'

  interface Props {
    resourceData?: ClusterResourceMetrics
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    resourceData: undefined,
    loading: false
  })

  const cpuChartRef = ref<HTMLElement>()
  const memoryChartRef = ref<HTMLElement>()
  let cpuChart: echarts.ECharts | null = null
  let memoryChart: echarts.ECharts | null = null
  let resizeTimer: NodeJS.Timeout | null = null

  const hasData = computed(() => {
    return !!(props.resourceData && Object.keys(props.resourceData).length > 0)
  })

  const initCPUChart = () => {
    if (!cpuChartRef.value) return
    cpuChart = echarts.init(cpuChartRef.value)

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#e6e9f0',
        borderWidth: 1,
        textStyle: { color: '#333', fontSize: 13 },
        padding: [12, 16],
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return ''
          const date = new Date(params[0].value[0])
          const timeStr = date.toLocaleString('zh-CN')
          let result = `<div style="font-weight: 600; margin-bottom: 8px;">${timeStr}</div>`
          params.forEach((item: any) => {
            const value = item.value[1].toFixed(3)
            result += `<div style="margin: 4px 0;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${item.color}; margin-right: 8px;"></span>
            ${item.seriesName}: ${value}%
          </div>`
          })
          return result
        }
      },
      legend: {
        data: ['使用率', '请求率'],
        bottom: 8,
        textStyle: { fontSize: 13, color: '#4a5568' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#e6e9f0' } },
        axisLabel: { color: '#718096', fontSize: 12 }
      },
      yAxis: {
        type: 'value',
        name: '使用率 (%)',
        nameTextStyle: { color: '#4a5568', fontSize: 13 },
        axisLine: { show: true, lineStyle: { color: '#e6e9f0' } },
        axisLabel: {
          formatter: '{value}%',
          color: '#718096',
          fontSize: 12
        },
        splitLine: { lineStyle: { color: '#f0f2f5', type: 'dashed' } }
      },
      series: [
        {
          name: '使用率',
          type: 'line',
          smooth: true,
          data: [],
          itemStyle: { color: '#667eea' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(102, 126, 234, 0.25)' },
              { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
            ])
          }
        },
        {
          name: '请求率',
          type: 'line',
          smooth: true,
          data: [],
          itemStyle: { color: '#f5576c' },
          lineStyle: { type: 'dashed' }
        }
      ]
    }

    cpuChart.setOption(option)
  }

  const initMemoryChart = () => {
    if (!memoryChartRef.value) return
    memoryChart = echarts.init(memoryChartRef.value)

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#e6e9f0',
        borderWidth: 1,
        textStyle: { color: '#333', fontSize: 13 },
        padding: [12, 16],
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return ''
          const date = new Date(params[0].value[0])
          const timeStr = date.toLocaleString('zh-CN')
          let result = `<div style="font-weight: 600; margin-bottom: 8px;">${timeStr}</div>`
          params.forEach((item: any) => {
            const value = item.value[1].toFixed(3)
            result += `<div style="margin: 4px 0;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${item.color}; margin-right: 8px;"></span>
            ${item.seriesName}: ${value}%
          </div>`
          })
          return result
        }
      },
      legend: {
        data: ['使用率', '请求率'],
        bottom: 8,
        textStyle: { fontSize: 13, color: '#4a5568' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#e6e9f0' } },
        axisLabel: { color: '#718096', fontSize: 12 }
      },
      yAxis: {
        type: 'value',
        name: '使用率 (%)',
        nameTextStyle: { color: '#4a5568', fontSize: 13 },
        axisLine: { show: true, lineStyle: { color: '#e6e9f0' } },
        axisLabel: {
          formatter: '{value}%',
          color: '#718096',
          fontSize: 12
        },
        splitLine: { lineStyle: { color: '#f0f2f5', type: 'dashed' } }
      },
      series: [
        {
          name: '使用率',
          type: 'line',
          smooth: true,
          data: [],
          itemStyle: { color: '#f093fb' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(240, 147, 251, 0.25)' },
              { offset: 1, color: 'rgba(240, 147, 251, 0.05)' }
            ])
          }
        },
        {
          name: '请求率',
          type: 'line',
          smooth: true,
          data: [],
          itemStyle: { color: '#f5576c' },
          lineStyle: { type: 'dashed' }
        }
      ]
    }

    memoryChart.setOption(option)
  }

  const updateCharts = () => {
    if (!props.resourceData) return

    // 更新 CPU 图表
    if (cpuChart && props.resourceData.cpu?.trend) {
      const cpuUsageData = props.resourceData.cpu.trend.map((item) => [
        item.timestamp * 1000,
        item.usagePercent
      ])
      const cpuRequestData = props.resourceData.cpu.trend.map((item) => [
        item.timestamp * 1000,
        item.requestsPercent
      ])

      cpuChart.setOption({
        series: [{ data: cpuUsageData }, { data: cpuRequestData }]
      })
    }

    // 更新内存图表
    if (memoryChart && props.resourceData.memory?.trend) {
      const memoryUsageData = props.resourceData.memory.trend.map((item) => [
        item.timestamp * 1000,
        item.usagePercent
      ])
      const memoryRequestData = props.resourceData.memory.trend.map((item) => [
        item.timestamp * 1000,
        item.requestsPercent
      ])

      memoryChart.setOption({
        series: [{ data: memoryUsageData }, { data: memoryRequestData }]
      })
    }
  }

  const handleResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      cpuChart?.resize()
      memoryChart?.resize()
    }, 300)
  }

  watch(
    () => props.resourceData,
    () => {
      nextTick(() => {
        if (hasData.value) {
          if (!cpuChart) initCPUChart()
          if (!memoryChart) initMemoryChart()
          updateCharts()
        }
      })
    },
    { deep: true }
  )

  onMounted(() => {
    if (hasData.value) {
      initCPUChart()
      initMemoryChart()
      updateCharts()
    }
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (resizeTimer) clearTimeout(resizeTimer)
    cpuChart?.dispose()
    memoryChart?.dispose()
  })
</script>

<style lang="scss" scoped>
  .resource-monitor {
    .monitor-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      overflow: hidden;
      animation: slideInUp 0.5s ease-out;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: linear-gradient(135deg, #e0f2fe 0%, #e0e7ff 100%);
      border-bottom: 1px solid #bfdbfe;
      flex-wrap: wrap;
      gap: 14px;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .icon-wrapper {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

          &.resource-icon {
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          }

          svg {
            width: 20px;
            height: 20px;
          }
        }

        .header-title {
          h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 700;
            color: #1a202c;
          }

          p {
            margin: 2px 0 0;
            font-size: 12px;
            color: #718096;
          }
        }
      }

      .header-stats {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        .stat-badge {
          padding: 6px 12px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;

          &.cpu {
            background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
            color: #4338ca;
          }

          &.memory {
            background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
            color: #9f1239;
          }

          &.pod {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            color: #065f46;
          }

          .label {
            opacity: 0.8;
          }

          .value {
            font-weight: 700;
            font-size: 14px;
          }
        }
      }
    }

    .resource-details {
      padding: 16px;
      padding-bottom: 24px;
      position: relative;
      z-index: 1;
      margin-bottom: 12px;

      .detail-card {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        background: white;
        border-radius: 8px;
        border: 1.5px solid #e5e7eb;
        transition: all 0.3s ease;
        min-height: 65px;
        height: 100%;
        margin-bottom: 16px;
        box-shadow: none;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        &.cpu-card {
          border-color: #c7d2fe;

          &:hover {
            border-color: #667eea;
            background: linear-gradient(135deg, #f5f7ff 0%, #ffffff 100%);
          }
        }

        &.memory-card {
          border-color: #fbcfe8;

          &:hover {
            border-color: #f093fb;
            background: linear-gradient(135deg, #fef5fb 0%, #ffffff 100%);
          }
        }

        &.pod-card {
          border-color: #a7f3d0;

          &:hover {
            border-color: #43e97b;
            background: linear-gradient(135deg, #f0fdf8 0%, #ffffff 100%);
          }
        }

        &.storage-card {
          border-color: #fde68a;

          &:hover {
            border-color: #fbbf24;
            background: linear-gradient(135deg, #fefce8 0%, #ffffff 100%);
          }
        }

        .detail-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          transition: transform 0.3s ease;
        }

        &:hover .detail-icon {
          transform: scale(1.05);
        }

        .detail-content {
          flex: 1;
          min-width: 0;

          .detail-label {
            font-size: 11px;
            color: #909399;
            margin-bottom: 2px;
            font-weight: 500;
          }

          .detail-value {
            font-size: 15px;
            font-weight: 700;
            color: #303133;
            margin-bottom: 2px;
            word-break: break-all;
            line-height: 1.2;
          }

          .detail-usage {
            font-size: 10px;
            color: #606266;
            opacity: 0.8;
            line-height: 1.2;
          }
        }
      }
    }

    .chart-section {
      padding: 0 16px 16px;
      position: relative;
      z-index: 0;
      margin-top: 4px;

      .chart-container {
        margin-bottom: 20px;

        .chart-header {
          margin-bottom: 16px;

          h4 {
            margin: 0;
            font-size: 15px;
            font-weight: 600;
            color: #303133;
            display: flex;
            align-items: center;
            gap: 8px;
          }
        }

        .chart {
          width: 100%;
          height: 280px;
        }
      }
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 350px;
      background: white;
      border-radius: 12px;
    }
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 1200px) {
    .resource-monitor .resource-details {
      .detail-card {
        min-height: 70px;

        .detail-icon {
          width: 36px;
          height: 36px;
          font-size: 18px;
        }

        .detail-content .detail-value {
          font-size: 15px;
        }
      }
    }
  }

  @media (max-width: 768px) {
    .resource-monitor {
      .card-header {
        padding: 16px 20px;

        .header-stats {
          width: 100%;
        }
      }

      .resource-details {
        padding: 14px;

        .detail-card {
          min-height: auto;
          padding: 10px 12px;

          .detail-icon {
            width: 32px;
            height: 32px;
            font-size: 18px;
          }

          .detail-content {
            .detail-value {
              font-size: 14px;
            }

            .detail-label {
              font-size: 10px;
            }

            .detail-usage {
              font-size: 9px;
            }
          }
        }
      }

      .chart-section {
        padding: 0 14px 14px;

        .chart-container .chart {
          height: 240px;
        }
      }
    }
  }
</style>
