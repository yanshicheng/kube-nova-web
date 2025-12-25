<template>
  <div class="memory-monitor" v-loading="loading">
    <Transition name="fade">
      <div v-if="hasData" class="monitor-card">
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="header-left">
            <div class="icon-wrapper memory-icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M17,9H7V7H17M17,13H7V11H17M14,17H7V15H14M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z"
                />
              </svg>
            </div>
            <div class="header-title">
              <h3>内存使用情况</h3>
              <p v-if="containerName" class="container-tag">
                <ElIcon><Box /></ElIcon>
                容器: {{ containerName }}
              </p>
              <p v-else class="pod-tag">
                <ElIcon><Box /></ElIcon>
                Pod 级别
              </p>
            </div>
          </div>
          <div class="header-stats">
            <div class="stat-badge avg">
              <span class="label">平均</span>
              <span class="value">{{ formatBytes(memoryData?.summary?.avgUsageBytes || 0) }}</span>
            </div>
            <div class="stat-badge peak">
              <span class="label">峰值</span>
              <span class="value">{{ formatBytes(memoryData?.summary?.maxUsageBytes || 0) }}</span>
            </div>
            <div class="stat-badge request">
              <span class="label">Request</span>
              <span class="value">{{ formatBytes(memoryData?.limits?.requestBytes || 0) }}</span>
            </div>
            <div class="stat-badge limit">
              <span class="label">Limit</span>
              <span class="value">{{
                memoryData?.limits?.hasLimit
                  ? formatBytes(memoryData?.limits?.limitBytes || 0)
                  : '无限制'
              }}</span>
            </div>
            <div class="stat-badge min">
              <span class="label">最小</span>
              <span class="value">{{ formatBytes(memoryData?.summary?.minUsageBytes || 0) }}</span>
            </div>
            <div class="stat-badge avg-percent">
              <span class="label">平均使用率</span>
              <span class="value">{{
                memoryData?.summary?.avgUsagePercent?.toFixed(2) || '0.00'
              }}</span>
              <span class="unit">%</span>
            </div>
            <div
              v-if="memoryData?.summary?.oomKills && memoryData.summary.oomKills > 0"
              class="stat-badge oom"
            >
              <ElIcon><Warning /></ElIcon>
              <span class="label">OOM</span>
              <span class="value">{{ memoryData.summary.oomKills }}</span>
              <span class="unit">次</span>
            </div>
          </div>
        </div>

        <!-- 图表区域 -->
        <div class="chart-section">
          <div class="chart-header">
            <h4>
              <ElIcon><TrendCharts /></ElIcon>
              使用趋势
            </h4>
            <div v-if="memoryData?.trend" class="chart-info">
              共 {{ memoryData.trend.length }} 个数据点
            </div>
          </div>
          <div ref="memoryChartRef" class="chart"></div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <ElEmpty description="暂无内存监控数据" :image-size="150">
          <template #image>
            <svg viewBox="0 0 24 24" width="150" height="150">
              <path
                fill="#dcdfe6"
                d="M17,9H7V7H17M17,13H7V11H17M14,17H7V15H14M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z"
              />
            </svg>
          </template>
        </ElEmpty>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
  import { Box, Warning, TrendCharts } from '@element-plus/icons-vue'
  import * as echarts from 'echarts'
  import type { PodMemoryMetrics, ContainerMemoryMetrics } from '@/api/console/pod-monitor'

  interface Props {
    memoryData?: PodMemoryMetrics | ContainerMemoryMetrics
    loading?: boolean
    containerName?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    memoryData: undefined,
    loading: false,
    containerName: undefined
  })

  const memoryChartRef = ref<HTMLElement>()
  let memoryChart: echarts.ECharts | null = null
  let resizeTimer: NodeJS.Timeout | null = null

  const hasData = computed(() => {
    return !!(props.memoryData && Object.keys(props.memoryData).length > 0)
  })

  // 🔧 智能格式化时间戳
  const smartFormatTime = (timestamp: any): string => {
    try {
      let date: Date

      if (typeof timestamp === 'number') {
        if (timestamp < 10000000000) {
          date = new Date(timestamp * 1000) // 秒级转毫秒
        } else {
          date = new Date(timestamp) // 毫秒级
        }
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp)
      } else if (timestamp instanceof Date) {
        date = timestamp
      } else {
        return '-'
      }

      if (isNaN(date.getTime())) return '-'

      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    } catch (error) {
      return '-'
    }
  }

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const initChart = () => {
    if (!memoryChartRef.value) return
    memoryChart = echarts.init(memoryChartRef.value)

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: { color: '#999' }
        },
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderColor: '#e6e9f0',
        borderWidth: 1,
        textStyle: { color: '#333', fontSize: 13 },
        padding: [12, 16],
        formatter: (params: any) => {
          if (!Array.isArray(params)) return ''
          // 🔥 使用 smartFormatTime 正确格式化时间
          let result = `<div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">${smartFormatTime(params[0].value[0])}</div>`
          params.forEach((item: any) => {
            const value =
              item.seriesName === '使用率 (%)'
                ? `${item.value[1].toFixed(2)}%`
                : formatBytes(item.value[1])
            result += `<div style="margin: 4px 0; display: flex; align-items: center; font-size: 13px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${item.color}; margin-right: 8px;"></span>
            <span style="flex: 1;">${item.seriesName}:</span>
            <span style="font-weight: 600; margin-left: 12px;">${value}</span>
          </div>`
          })
          return result
        }
      },
      legend: {
        data: ['使用量', 'WorkingSet', '使用率 (%)'],
        bottom: 10,
        textStyle: { fontSize: 13, color: '#4a5568' },
        itemWidth: 20,
        itemHeight: 12,
        itemGap: 24
      },
      grid: {
        left: '5%',
        right: '50px',
        bottom: '50px',
        top: '50px',
        containLabel: true
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#e6e9f0', width: 1 } },
        axisLabel: { color: '#718096', fontSize: 12 },
        splitLine: { show: true, lineStyle: { color: '#f0f2f5', type: 'dashed' } }
      },
      yAxis: [
        {
          type: 'value',
          name: '内存',
          position: 'left',
          nameTextStyle: { color: '#4a5568', fontSize: 13 },
          nameGap: 25,
          axisLine: { show: true, lineStyle: { color: '#e6e9f0', width: 1 } },
          axisLabel: {
            formatter: (value: number) => formatBytes(value),
            color: '#718096',
            fontSize: 12
          },
          splitLine: { lineStyle: { color: '#f0f2f5', type: 'dashed' } }
        },
        {
          type: 'value',
          name: '使用率 (%)',
          position: 'right',
          nameTextStyle: { color: '#4a5568', fontSize: 13 },
          nameGap: 25,
          axisLine: { show: true, lineStyle: { color: '#e6e9f0', width: 1 } },
          axisLabel: { formatter: '{value}%', color: '#718096', fontSize: 12 },
          min: 0,
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '使用量',
          type: 'line',
          smooth: true,
          data: [],
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { width: 3 },
          itemStyle: { color: '#f5576c' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(245, 87, 108, 0.25)' },
              { offset: 1, color: 'rgba(245, 87, 108, 0.05)' }
            ])
          }
        },
        {
          name: 'WorkingSet',
          type: 'line',
          smooth: true,
          data: [],
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { width: 3 },
          itemStyle: { color: '#fa8c16' }
        },
        {
          name: '使用率 (%)',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          data: [],
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { width: 3 },
          itemStyle: { color: '#667eea' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(102, 126, 234, 0.25)' },
              { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
            ])
          }
        }
      ]
    }
    memoryChart.setOption(option)
  }

  /** ✅ 完整修复：动态调整内存使用率 Y 轴 */
  const updateChart = () => {
    if (!memoryChart || !props.memoryData?.trend || props.memoryData.trend.length === 0) {
      return
    }

    const usageData = props.memoryData.trend.map((item) => [item.timestamp, item.usageBytes])
    const workingSetData = props.memoryData.trend.map((item) => [
      item.timestamp,
      item.workingSetBytes
    ])
    const percentData = props.memoryData.trend.map((item) => [item.timestamp, item.usagePercent])

    // ✅ 计算使用率范围
    const percentValues = percentData.map((d) => d[1] as number).filter((v) => !isNaN(v) && v >= 0)
    const maxPercent = percentValues.length > 0 ? Math.max(...percentValues) : 1

    // ✅ 动态调整右 Y 轴
    let percentMax: number
    if (maxPercent <= 0.1) {
      percentMax = 0.5
    } else if (maxPercent <= 1) {
      percentMax = 1
    } else if (maxPercent <= 5) {
      percentMax = 5
    } else if (maxPercent <= 10) {
      percentMax = 10
    } else if (maxPercent <= 20) {
      percentMax = 20
    } else if (maxPercent <= 50) {
      percentMax = 50
    } else {
      percentMax = 100
    }

    memoryChart.setOption({
      yAxis: [
        { min: 'dataMin', max: 'dataMax' },
        { min: 0, max: percentMax }
      ],
      series: [{ data: usageData }, { data: workingSetData }, { data: percentData }]
    })
  }

  const handleResize = () => {
    memoryChart?.resize()  // 直接 resize，不要定时器
  }

  watch(
    () => props.memoryData,
    (newData) => {
      if (newData && newData.trend && newData.trend.length > 0) {
        nextTick(() => {
          if (!memoryChart) initChart()
          updateChart()
        })
      }
    },
    { deep: true }
  )
  let resizeObserver: ResizeObserver | null = null

  // 修改 onMounted
  onMounted(() => {
    if (hasData.value) {
      initChart()
      updateChart()
    }

    window.addEventListener('resize', handleResize)

    // ✅ 关键：监听容器尺寸变化
    if (memoryChartRef.value) {
      resizeObserver = new ResizeObserver(() => {
        handleResize()
      })
      resizeObserver.observe(memoryChartRef.value)
    }
  })

  // 修改 onUnmounted
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    resizeObserver?.disconnect()
    memoryChart?.dispose()
  })
</script>

<style lang="scss" scoped>
  /* 样式保持不变 - 从原文件复制 */
  .memory-monitor {
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
      background: linear-gradient(135deg, #fef5f8 0%, #fee8ef 100%);
      border-bottom: 1px solid #fecdd7;
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

          svg {
            width: 20px;
            height: 20px;
          }

          &.memory-icon {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }
        }

        .header-title {
          h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 700;
            color: #1a202c;
            line-height: 1.3;
          }

          p {
            margin: 2px 0 0;
            font-size: 12px;
            color: #718096;
            display: flex;
            align-items: center;
            gap: 4px;

            &.container-tag {
              color: #409eff;
            }
          }
        }
      }

      .header-stats {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        flex: 1;
        justify-content: flex-end;
        .stat-badge {
          padding: 6px 12px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;

          &.avg {
            background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
            color: #4c51bf;
          }

          &.peak {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            color: #92400e;
          }

          &.request {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            color: #1e40af;
          }

          &.limit {
            background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
            color: #9f1239;
          }

          &.min {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            color: #065f46;
          }

          &.avg-percent {
            background: linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%);
            color: #6b21a8;
          }

          &.oom {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            color: #991b1b;
            animation: pulse 2s ease-in-out infinite;
          }

          .label {
            opacity: 0.8;
          }

          .value {
            font-weight: 700;
            font-size: 14px;
          }

          .unit {
            opacity: 0.7;
            font-size: 11px;
          }
        }
      }
    }

    .chart-section {
      padding: 2px;

      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;

        h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #1a202c;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .chart-info {
          font-size: 12px;
          color: #909399;
          padding: 4px 12px;
          background: #f5f7fa;
          border-radius: 6px;
        }
      }

      .chart {
        width: 100%;
        height: 380px;
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

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  @media (max-width: 768px) {
    .memory-monitor {
      .card-header {
        padding: 14px 18px;

        .header-left {
          .icon-wrapper {
            width: 32px;
            height: 32px;

            svg {
              width: 18px;
              height: 18px;
            }
          }

          .header-title h3 {
            font-size: 15px;
          }
        }

        .header-stats {
          width: 100%;

          .stat-badge {
            padding: 5px 10px;
            font-size: 11px;

            .value {
              font-size: 13px;
            }
          }
        }
      }

      .chart-section {
        padding: 18px;

        .chart-header h4 {
          font-size: 15px;
        }

        .chart {
          height: 300px;
        }
      }
    }
  }
</style>
